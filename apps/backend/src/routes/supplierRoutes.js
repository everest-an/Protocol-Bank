const express = require('express');
const router = express.Router();

// Supplier controller (to be created)
const supplierController = {
  // Get all suppliers
  getAllSuppliers: async (req, res) => {
    try {
      const { search, category } = req.query;
      
      // Mock data for now - replace with actual database query
      let suppliers = [
        {
          id: 1,
          name: 'Acme Corp',
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          email: 'contact@acme.com',
          category: 'AI Services',
          totalPaid: '50000',
          paymentCount: 15,
          lastPaymentDate: '2025-11-10',
          createdAt: '2025-01-15'
        },
        {
          id: 2,
          name: 'TechVendor Inc',
          address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
          email: 'sales@techvendor.com',
          category: 'Software',
          totalPaid: '35000',
          paymentCount: 10,
          lastPaymentDate: '2025-11-08',
          createdAt: '2025-02-20'
        }
      ];
      
      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        suppliers = suppliers.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.address.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (category && category !== 'All') {
        suppliers = suppliers.filter(s => s.category === category);
      }
      
      res.json({
        success: true,
        data: suppliers,
        total: suppliers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get supplier by ID
  getSupplierById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock data - replace with actual database query
      const supplier = {
        id: parseInt(id),
        name: 'Acme Corp',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        email: 'contact@acme.com',
        category: 'AI Services',
        totalPaid: '50000',
        paymentCount: 15,
        lastPaymentDate: '2025-11-10',
        createdAt: '2025-01-15',
        paymentHistory: [
          {
            id: 1,
            amount: '5000',
            token: 'USDC',
            date: '2025-11-10',
            txHash: '0xabc123...',
            status: 'completed'
          }
        ]
      };
      
      res.json({
        success: true,
        data: supplier
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Create new supplier
  createSupplier: async (req, res) => {
    try {
      const { name, address, email, category } = req.body;
      
      // Validation
      if (!name || !address) {
        return res.status(400).json({
          success: false,
          error: 'Name and address are required'
        });
      }
      
      // Mock response - replace with actual database insert
      const newSupplier = {
        id: Date.now(),
        name,
        address,
        email,
        category: category || 'Other',
        totalPaid: '0',
        paymentCount: 0,
        lastPaymentDate: null,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: newSupplier
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Update supplier
  updateSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, email, category } = req.body;
      
      // Mock response - replace with actual database update
      const updatedSupplier = {
        id: parseInt(id),
        name,
        address,
        email,
        category,
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: updatedSupplier
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Delete supplier
  deleteSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock response - replace with actual database delete
      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get supplier payment history
  getSupplierPayments: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock data - replace with actual database query
      const payments = [
        {
          id: 1,
          supplierId: parseInt(id),
          amount: '5000',
          token: 'USDC',
          date: '2025-11-10',
          txHash: '0xabc123...',
          status: 'completed',
          type: 'stream'
        },
        {
          id: 2,
          supplierId: parseInt(id),
          amount: '3000',
          token: 'USDC',
          date: '2025-11-05',
          txHash: '0xdef456...',
          status: 'completed',
          type: 'batch'
        }
      ];
      
      res.json({
        success: true,
        data: payments,
        total: payments.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Routes
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);
router.get('/:id/payments', supplierController.getSupplierPayments);

module.exports = router;
