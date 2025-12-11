import db from '../../config/db.js';

const OwnerDashboardModel = {

    // 1. GET DASHBOARD ANALYTICS (The Heavy Lifter)
    getAnalytics: async (startDate, endDate) => {
        const params = [startDate, endDate];
        
        // A. FINANCIALS (Sales, Collections, Receivables)
        const [financials] = await db.query(`
            SELECT 
                IFNULL(SUM(total_amount), 0) as gross_sales,
                IFNULL(SUM(downpayment), 0) as cash_collected,
                IFNULL(SUM(balance), 0) as receivables
            FROM TransactionDb
            WHERE DATE(DATE_ADD(created_at, INTERVAL 8 HOUR)) BETWEEN ? AND ?
            AND booking_status != 'Cancelled'
        `, params);

        // B. BOOKING SOURCE COMPARISON (Online vs Walk-in)
        const [sources] = await db.query(`
            SELECT 
                booking_type,
                COUNT(*) as count,
                IFNULL(SUM(total_amount), 0) as revenue
            FROM TransactionDb
            WHERE DATE(DATE_ADD(created_at, INTERVAL 8 HOUR)) BETWEEN ? AND ?
            AND booking_status != 'Cancelled'
            GROUP BY booking_type
        `, params);

        // C. OPERATIONAL STATUS COUNTS
        const [operations] = await db.query(`
            SELECT 
                booking_status,
                COUNT(*) as count
            FROM TransactionDb
            WHERE DATE(DATE_ADD(created_at, INTERVAL 8 HOUR)) BETWEEN ? AND ?
            GROUP BY booking_status
        `, params);

        // D. REVENUE TREND (Daily for the selected range)
        const [trend] = await db.query(`
            SELECT 
                DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') as date,
                IFNULL(SUM(total_amount), 0) as sales
            FROM TransactionDb
            WHERE DATE(DATE_ADD(created_at, INTERVAL 8 HOUR)) BETWEEN ? AND ?
            AND booking_status != 'Cancelled'
            GROUP BY date
            ORDER BY date ASC
        `, params);

        return {
            financials: financials[0],
            sources,
            operations,
            trend
        };
    },

    getTransactions: async (startDate, endDate) => {
        const [rows] = await db.query(`
            SELECT 
                t.id,
                t.transaction_ref, 
                t.customer_name, 
                t.booking_type, 
                t.total_amount,
                t.balance,
                t.booking_status,
                t.extension_history,
                
                -- Ito yung dating date (Fallback)
                DATE_FORMAT(DATE_ADD(t.created_at, INTERVAL 8 HOUR), '%M %d, %Y %h:%i %p') as formatted_date,

                -- 👇 ITO ANG KULANG: Kunin ang Check-in/Check-out mula sa ReservationDb
                DATE_FORMAT(MIN(r.check_in_date), '%b %d, %Y %h:%i %p') as check_in_formatted,
                DATE_FORMAT(MAX(r.check_out_date), '%b %d, %Y %h:%i %p') as check_out_formatted,
                
                GROUP_CONCAT(DISTINCT r.amenity_name SEPARATOR ', ') as amenities_summary

            FROM TransactionDb t
            LEFT JOIN ReservationDb r ON t.id = r.transaction_id
            
            WHERE DATE(DATE_ADD(t.created_at, INTERVAL 8 HOUR)) BETWEEN ? AND ?
            
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `, [startDate, endDate]);
        
        return rows;
    }

};

export default OwnerDashboardModel;
