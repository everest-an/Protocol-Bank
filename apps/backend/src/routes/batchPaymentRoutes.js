const express = require('express');
const router = express.Router();
const batchPaymentController = require('../controllers/batchPaymentController');
const multer = require('multer');

// 配置文件上传
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * @route POST /api/v1/batch-payment/create
 * @desc 创建批量支付
 * @body {from_account_id, recipients: [{to_account_id, amount, note, category}]}
 */
router.post('/create', batchPaymentController.createBatchPayment);

/**
 * @route POST /api/v1/batch-payment/upload
 * @desc 上传 CSV 文件创建批量支付
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { from_account_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    // 读取 CSV 文件
    const fs = require('fs');
    const csvContent = fs.readFileSync(file.path, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // 跳过表头
    const dataLines = lines.slice(1);
    const recipients = [];

    for (const line of dataLines) {
      const [address, amount, category, note] = line.split(',').map(s => s.trim());
      
      if (address && amount) {
        recipients.push({
          to_address: address,
          amount: parseFloat(amount),
          category: category || '',
          note: note || '',
        });
      }
    }

    // 删除临时文件
    fs.unlinkSync(file.path);

    // 创建批量支付
    req.body.recipients = recipients;
    await batchPaymentController.createBatchPayment(req, res);
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing CSV file',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/batch-payment/:batch_id
 * @desc 获取批量支付状态
 */
router.get('/:batch_id', batchPaymentController.getBatchPaymentStatus);

/**
 * @route GET /api/v1/batch-payment/history/:account_id
 * @desc 获取账户的批量支付历史
 */
router.get('/history/:account_id', batchPaymentController.getBatchPaymentHistory);

module.exports = router;
