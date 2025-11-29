import OwnerDashboardModel from '../../models/owner/OwnerDashboardModel.js';

const OwnerDashboardController = {
    getStats: async (req, res) => {
        try {
            const data = await OwnerDashboardModel.getStats();
            res.json({
                totalRevenue: data.salesStats.totalRevenue,
                totalTransactions: data.salesStats.totalTransactions,
                totalFeedback: data.feedbackStats.totalFeedback,
                salesByService: data.salesByService,
                feedbackDistribution: data.feedbackDist
            });
        } catch (err) { 
            console.error("Dashboard Stats Error:", err);
            res.status(500).json({ totalRevenue: 0, totalTransactions: 0, totalFeedback: 0, salesByService: [], feedbackDistribution: [] }); 
        }
    },
    
    getSales: async (req, res) => {
        try {
            const { year, month, filterType } = req.query;
            const chartData = await OwnerDashboardModel.getSalesForChart(year, month, filterType);
            const serviceData = await OwnerDashboardModel.getSalesByService(year, month, filterType);
            const stats = await OwnerDashboardModel.getSalesStatsBoxes(); 
            const recentSales = await OwnerDashboardModel.getRecentSales(); 

            res.json({ chartData, serviceData, stats, recentSales });
        } catch (err) { 
            console.error("Sales Charts Controller Error:", err);
            res.status(500).json({ message: 'Error fetching sales charts and stats' }); 
        }
    },

    getSalesHistory: async (req, res) => {
        try {
            const { startDate, endDate, category, paymentMethod } = req.query;
            const history = await OwnerDashboardModel.getSalesHistory(startDate, endDate, category, paymentMethod);
            res.json(history);
        } catch (err) {
            console.error("Sales History Controller Error:", err);
            res.status(500).json([]);
        }
    },
    
    getYears: async (req, res) => {
        try { 
            const years = await OwnerDashboardModel.getYears(); 
            res.json(years); 
        } catch (err) { res.status(500).json([]); }
    },

    getFeedback: async (req, res) => {
        try {
            const { startDate, endDate, filter } = req.query;
            const feedback = await OwnerDashboardModel.getFeedback(startDate, endDate, filter);
            res.json({ feedback });
        } catch (err) { res.status(500).json({ feedback: [] }); }
    },
};

export default OwnerDashboardController;
