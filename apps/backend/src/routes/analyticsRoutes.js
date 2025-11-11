const express = require('express');
const router = express.Router();

// Analytics controller
const analyticsController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Mock data - replace with actual database queries
      const stats = {
        totalSpent: '125000',
        totalSpentChange: 15.3,
        averagePayment: '2500',
        averagePaymentChange: -5.2,
        uniqueRecipients: 45,
        uniqueRecipientsChange: 8.7,
        successRate: 98.5,
        successRateChange: 2.1,
        period: {
          start: startDate || '2025-01-01',
          end: endDate || '2025-11-12'
        }
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get payment trends
  getPaymentTrends: async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      
      // Mock data
      const trends = [
        { date: '2025-01', amount: 45000, count: 18 },
        { date: '2025-02', amount: 52000, count: 21 },
        { date: '2025-03', amount: 48000, count: 19 },
        { date: '2025-04', amount: 55000, count: 22 },
        { date: '2025-05', amount: 61000, count: 24 },
        { date: '2025-06', amount: 58000, count: 23 },
        { date: '2025-07', amount: 63000, count: 25 },
        { date: '2025-08', amount: 67000, count: 27 },
        { date: '2025-09', amount: 71000, count: 28 },
        { date: '2025-10', amount: 75000, count: 30 },
        { date: '2025-11', amount: 80000, count: 32 }
      ];
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get category distribution
  getCategoryDistribution: async (req, res) => {
    try {
      // Mock data
      const distribution = [
        { category: 'AI Services', amount: '35000', percentage: 28, count: 12 },
        { category: 'Marketing', amount: '28000', percentage: 22.4, count: 10 },
        { category: 'Software', amount: '25000', percentage: 20, count: 8 },
        { category: 'Logistics', amount: '20000', percentage: 16, count: 7 },
        { category: 'Consulting', amount: '12000', percentage: 9.6, count: 5 },
        { category: 'Other', amount: '5000', percentage: 4, count: 3 }
      ];
      
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get top recipients
  getTopRecipients: async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      
      // Mock data
      const recipients = [
        {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          name: 'Acme Corp',
          totalAmount: '50000',
          paymentCount: 15,
          category: 'AI Services',
          lastPaymentDate: '2025-11-10'
        },
        {
          address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
          name: 'TechVendor Inc',
          totalAmount: '35000',
          paymentCount: 10,
          category: 'Software',
          lastPaymentDate: '2025-11-08'
        },
        {
          address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
          name: 'Global Logistics',
          totalAmount: '28000',
          paymentCount: 8,
          category: 'Logistics',
          lastPaymentDate: '2025-11-05'
        },
        {
          address: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
          name: 'Marketing Pro',
          totalAmount: '22000',
          paymentCount: 7,
          category: 'Marketing',
          lastPaymentDate: '2025-11-03'
        },
        {
          address: '0x1234567890123456789012345678901234567890',
          name: 'Security Services Inc',
          totalAmount: '18000',
          paymentCount: 6,
          category: 'Security Services',
          lastPaymentDate: '2025-11-01'
        }
      ];
      
      res.json({
        success: true,
        data: recipients.slice(0, parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get monthly comparison
  getMonthlyComparison: async (req, res) => {
    try {
      // Mock data
      const comparison = [
        { month: 'Jan', amount: 45000 },
        { month: 'Feb', amount: 52000 },
        { month: 'Mar', amount: 48000 },
        { month: 'Apr', amount: 55000 },
        { month: 'May', amount: 61000 },
        { month: 'Jun', amount: 58000 },
        { month: 'Jul', amount: 63000 },
        { month: 'Aug', amount: 67000 },
        { month: 'Sep', amount: 71000 },
        { month: 'Oct', amount: 75000 },
        { month: 'Nov', amount: 80000 },
        { month: 'Dec', amount: 0 }
      ];
      
      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Export analytics data
  exportAnalytics: async (req, res) => {
    try {
      const { format = 'csv', startDate, endDate } = req.query;
      
      // Mock CSV data
      const csvData = `Date,Category,Amount,Token,Recipient,Status
2025-11-10,AI Services,5000,USDC,Acme Corp,Completed
2025-11-08,Software,3500,USDC,TechVendor Inc,Completed
2025-11-05,Logistics,2800,USDC,Global Logistics,Completed
2025-11-03,Marketing,2200,USDC,Marketing Pro,Completed
2025-11-01,Security Services,1800,USDC,Security Services Inc,Completed`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Routes
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/trends', analyticsController.getPaymentTrends);
router.get('/categories', analyticsController.getCategoryDistribution);
router.get('/top-recipients', analyticsController.getTopRecipients);
router.get('/monthly', analyticsController.getMonthlyComparison);
router.get('/export', analyticsController.exportAnalytics);

module.exports = router;
