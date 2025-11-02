const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// 账户管理路由
router.post('/create', accountController.createAccount);
router.get('/:account_id', accountController.getAccount);
router.put('/:account_id/update', accountController.updateAccount);
router.post('/:account_id/deposit', accountController.deposit);
router.post('/:account_id/withdraw', accountController.withdraw);

module.exports = router;
