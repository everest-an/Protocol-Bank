const express = require('express');
const router = express.Router();
const nettingEngineController = require('../controllers/nettingEngineController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Trade routes
router.post('/trades', authenticateToken, nettingEngineController.submitTrade);
router.get('/trades/:tradeId', authenticateToken, nettingEngineController.getTrade);
router.get('/trades/statistics', authenticateToken, nettingEngineController.getTradeStatistics);

// Batch routes
router.get('/batches', authenticateToken, nettingEngineController.getRecentBatches);
router.get('/batches/:batchId', authenticateToken, nettingEngineController.getBatch);
router.get('/batches/statistics', authenticateToken, nettingEngineController.getBatchStatistics);

// Settlement routes (admin only - add admin middleware later)
router.post('/settlement/trigger', authenticateToken, nettingEngineController.triggerSettlement);
router.post('/batches/:batchId/settle', authenticateToken, nettingEngineController.settleBatch);

// Participant routes
router.get('/participants', authenticateToken, nettingEngineController.getParticipants);
router.post('/participants', authenticateToken, nettingEngineController.registerParticipant);

module.exports = router;
