const Trade = require('../models/netting-engine/Trade');
const SettlementBatch = require('../models/netting-engine/SettlementBatch');
const Participant = require('../models/netting-engine/Participant');
const SettlementCoordinator = require('../services/netting-engine/SettlementCoordinator');

/**
 * Submit a new trade instruction
 */
exports.submitTrade = async (req, res) => {
  try {
    const { tradeId, payerAddress, receiverAddress, amount, currency } = req.body;

    // Validate required fields
    if (!payerAddress || !receiverAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: payerAddress, receiverAddress, amount',
      });
    }

    // Validate amount
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    // Check if participants are registered
    const payerExists = await Participant.isActive(payerAddress);
    const receiverExists = await Participant.isActive(receiverAddress);

    if (!payerExists) {
      return res.status(400).json({
        success: false,
        message: `Payer ${payerAddress} is not a registered participant`,
      });
    }

    if (!receiverExists) {
      return res.status(400).json({
        success: false,
        message: `Receiver ${receiverAddress} is not a registered participant`,
      });
    }

    // Create trade
    const trade = await Trade.create({
      tradeId,
      payerAddress,
      receiverAddress,
      amount: amountFloat,
      currency: currency || 'USDC',
    });

    res.status(202).json({
      success: true,
      message: 'Trade accepted for processing',
      data: {
        tradeId: trade.trade_id,
        status: trade.status,
        createdAt: trade.created_at,
      },
    });
  } catch (error) {
    console.error('[NettingEngine] Error submitting trade:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit trade',
    });
  }
};

/**
 * Get trade by ID
 */
exports.getTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;

    const trade = await Trade.getById(tradeId);

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found',
      });
    }

    res.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error('[NettingEngine] Error getting trade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trade',
    });
  }
};

/**
 * Get trade statistics
 */
exports.getTradeStatistics = async (req, res) => {
  try {
    const stats = await Trade.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[NettingEngine] Error getting trade statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trade statistics',
    });
  }
};

/**
 * Get settlement batch by ID
 */
exports.getBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await SettlementBatch.getById(parseInt(batchId));

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error('[NettingEngine] Error getting batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch',
    });
  }
};

/**
 * Get recent settlement batches
 */
exports.getRecentBatches = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const batches = await SettlementBatch.getRecent(limit, offset);

    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error('[NettingEngine] Error getting recent batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent batches',
    });
  }
};

/**
 * Get batch statistics
 */
exports.getBatchStatistics = async (req, res) => {
  try {
    const stats = await SettlementBatch.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[NettingEngine] Error getting batch statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch statistics',
    });
  }
};

/**
 * Trigger manual settlement (admin only)
 */
exports.triggerSettlement = async (req, res) => {
  try {
    const { windowStart, windowEnd } = req.body;

    const coordinator = new SettlementCoordinator();

    let result;
    if (windowStart && windowEnd) {
      result = await coordinator.runSettlement(
        new Date(windowStart),
        new Date(windowEnd)
      );
    } else {
      result = await coordinator.runHourlySettlement();
    }

    res.json({
      success: true,
      message: 'Settlement completed',
      data: result,
    });
  } catch (error) {
    console.error('[NettingEngine] Error triggering settlement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger settlement',
    });
  }
};

/**
 * Settle a batch on-chain (admin only)
 */
exports.settleBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const coordinator = new SettlementCoordinator();
    const result = await coordinator.settleBatch(parseInt(batchId));

    res.json({
      success: true,
      message: 'Batch settled on-chain',
      data: result,
    });
  } catch (error) {
    console.error('[NettingEngine] Error settling batch:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to settle batch',
    });
  }
};

/**
 * Get all participants
 */
exports.getParticipants = async (req, res) => {
  try {
    const participants = await Participant.getAll();

    res.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    console.error('[NettingEngine] Error getting participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get participants',
    });
  }
};

/**
 * Register a new participant (admin only)
 */
exports.registerParticipant = async (req, res) => {
  try {
    const { address, name } = req.body;

    if (!address || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: address, name',
      });
    }

    const participant = await Participant.upsert({
      address,
      name,
      registeredAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Participant registered',
      data: participant,
    });
  } catch (error) {
    console.error('[NettingEngine] Error registering participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register participant',
    });
  }
};
