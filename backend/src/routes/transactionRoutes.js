const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// 交易系统路由
router.post('/transfer', transactionController.createTransfer);
router.get('/:transaction_id', transactionController.getTransaction);
router.get('/history/:account_id', transactionController.getTransactionHistory);
router.get('/stats/:account_id', transactionController.getTransactionStats);

module.exports = router;
