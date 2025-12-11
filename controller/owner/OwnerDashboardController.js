import OwnerDashboardModel from '../../models/owner/OwnerDashboardModel.js';

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
    }
};

export default OwnerDashboardController;