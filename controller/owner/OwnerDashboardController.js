import OwnerDashboardModel from '../../models/owner/OwnerDashboardModel.js';
import { Parser } from 'json2csv'; 

const OwnerDashboardController = {
    
    getAnalyticsData: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            // Default to today if no date provided
            const start = startDate || new Date().toISOString().split('T')[0];
            const end = endDate || new Date().toISOString().split('T')[0];

            const [analytics, transactions] = await Promise.all([
                OwnerDashboardModel.getAnalytics(start, end),
                OwnerDashboardModel.getTransactions(start, end)
            ]);

            res.json({ 
                success: true, 
                analytics, 
                transactions 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server Error" });
        }
    },

    exportData: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const transactions = await OwnerDashboardModel.getTransactions(startDate, endDate);

            if (transactions.length === 0) return res.status(404).send("No data");

            const fields = ['transaction_ref', 'formatted_date', 'customer_name', 'booking_type', 'booking_status', 'total_amount', 'downpayment', 'balance', 'amenities_summary'];
            const parser = new Parser({ fields });
            const csv = parser.parse(transactions);

            res.header('Content-Type', 'text/csv');
            res.attachment(`Sales_Report_${startDate}_to_${endDate}.csv`);
            return res.send(csv);

        } catch (error) {
            console.error(error);
            res.status(500).send("Export Error");
        }
    }
};

export default OwnerDashboardController;