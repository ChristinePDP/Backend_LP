import db from '../../config/db.js';

const OwnerDashboardModel = {

    getAnalytics: async (startDate, endDate) => {
        const params = [startDate, endDate];
        
        const [financials] = await db.query(`
            SELECT 
                IFNULL(SUM(total_amount), 0) as gross_sales,
                IFNULL(SUM(downpayment), 0) as cash_collected,
                IFNULL(SUM(balance), 0) as receivables
            FROM TransactionDb
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND booking_status != 'Cancelled'
        `, params);

        const [sources] = await db.query(`
            SELECT 
                booking_type,
                COUNT(*) as count,
                IFNULL(SUM(total_amount), 0) as revenue
            FROM TransactionDb
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND booking_status != 'Cancelled'
            GROUP BY booking_type
        `, params);

        const [operations] = await db.query(`
            SELECT 
                booking_status,
                COUNT(*) as count
            FROM TransactionDb
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY booking_status
        `, params);

        const [trend] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                IFNULL(SUM(total_amount), 0) as sales
            FROM TransactionDb
            WHERE DATE(created_at) BETWEEN ? AND ?
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
                t.downpayment, 
                t.booking_status,
                t.extension_history,
                
                DATE_FORMAT(t.created_at, '%M %d, %Y %h:%i %p') as formatted_date,

                DATE_FORMAT(MIN(r.check_in_date), '%b %d, %Y %h:%i %p') as check_in_formatted,
                DATE_FORMAT(MAX(r.check_out_date), '%b %d, %Y %h:%i %p') as check_out_formatted,
                
                GROUP_CONCAT(DISTINCT r.amenity_name SEPARATOR ', ') as amenities_summary

            FROM TransactionDb t
            LEFT JOIN ReservationDb r ON t.id = r.transaction_id
            
            -- Filter logic(Database Date)
            WHERE DATE(t.created_at) BETWEEN ? AND ?
            
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `, [startDate, endDate]);
        
        return rows;
    }

};

export default OwnerDashboardModel;