const express = require('express');
const router = express.Router();

// Automation controller
const automationController = {
  // Get all workflows
  getAllWorkflows: async (req, res) => {
    try {
      const { status } = req.query;
      
      // Mock data
      let workflows = [
        {
          id: 1,
          name: 'Auto-pay suppliers monthly',
          description: 'Automatically pay all suppliers on the 1st of each month',
          trigger: {
            type: 'schedule',
            schedule: '0 0 1 * *' // First day of month at midnight
          },
          actions: [
            {
              type: 'batch_payment',
              config: {
                suppliers: 'all',
                token: 'USDC'
              }
            }
          ],
          status: 'active',
          lastRun: '2025-11-01T00:00:00Z',
          nextRun: '2025-12-01T00:00:00Z',
          runCount: 10,
          createdAt: '2025-01-15T00:00:00Z'
        },
        {
          id: 2,
          name: 'Alert on large payments',
          description: 'Send notification when payment exceeds $10,000',
          trigger: {
            type: 'event',
            event: 'payment_created',
            condition: 'amount > 10000'
          },
          actions: [
            {
              type: 'notification',
              config: {
                channel: 'email',
                template: 'large_payment_alert'
              }
            }
          ],
          status: 'active',
          lastRun: '2025-11-10T15:30:00Z',
          runCount: 25,
          createdAt: '2025-02-20T00:00:00Z'
        }
      ];
      
      if (status) {
        workflows = workflows.filter(w => w.status === status);
      }
      
      res.json({
        success: true,
        data: workflows,
        total: workflows.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get workflow by ID
  getWorkflowById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const workflow = {
        id: parseInt(id),
        name: 'Auto-pay suppliers monthly',
        description: 'Automatically pay all suppliers on the 1st of each month',
        trigger: {
          type: 'schedule',
          schedule: '0 0 1 * *'
        },
        actions: [
          {
            type: 'batch_payment',
            config: {
              suppliers: 'all',
              token: 'USDC'
            }
          }
        ],
        status: 'active',
        lastRun: '2025-11-01T00:00:00Z',
        nextRun: '2025-12-01T00:00:00Z',
        runCount: 10,
        createdAt: '2025-01-15T00:00:00Z',
        executionHistory: [
          {
            id: 1,
            startTime: '2025-11-01T00:00:00Z',
            endTime: '2025-11-01T00:05:30Z',
            status: 'success',
            result: {
              paymentsCreated: 15,
              totalAmount: '50000'
            }
          }
        ]
      };
      
      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Create workflow
  createWorkflow: async (req, res) => {
    try {
      const { name, description, trigger, actions } = req.body;
      
      if (!name || !trigger || !actions) {
        return res.status(400).json({
          success: false,
          error: 'Name, trigger, and actions are required'
        });
      }
      
      const newWorkflow = {
        id: Date.now(),
        name,
        description,
        trigger,
        actions,
        status: 'active',
        runCount: 0,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: newWorkflow
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Update workflow
  updateWorkflow: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedWorkflow = {
        id: parseInt(id),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: updatedWorkflow
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Delete workflow
  deleteWorkflow: async (req, res) => {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Toggle workflow status
  toggleWorkflowStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      res.json({
        success: true,
        data: {
          id: parseInt(id),
          status,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Execute workflow manually
  executeWorkflow: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Trigger workflow execution
      res.json({
        success: true,
        message: 'Workflow execution started',
        executionId: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  // Get workflow execution history
  getExecutionHistory: async (req, res) => {
    try {
      const { id } = req.params;
      
      const history = [
        {
          id: 1,
          workflowId: parseInt(id),
          startTime: '2025-11-01T00:00:00Z',
          endTime: '2025-11-01T00:05:30Z',
          status: 'success',
          result: {
            paymentsCreated: 15,
            totalAmount: '50000'
          }
        },
        {
          id: 2,
          workflowId: parseInt(id),
          startTime: '2025-10-01T00:00:00Z',
          endTime: '2025-10-01T00:04:15Z',
          status: 'success',
          result: {
            paymentsCreated: 14,
            totalAmount: '48000'
          }
        }
      ];
      
      res.json({
        success: true,
        data: history,
        total: history.length
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
router.get('/', automationController.getAllWorkflows);
router.get('/:id', automationController.getWorkflowById);
router.post('/', automationController.createWorkflow);
router.put('/:id', automationController.updateWorkflow);
router.delete('/:id', automationController.deleteWorkflow);
router.post('/:id/toggle', automationController.toggleWorkflowStatus);
router.post('/:id/execute', automationController.executeWorkflow);
router.get('/:id/history', automationController.getExecutionHistory);

module.exports = router;
