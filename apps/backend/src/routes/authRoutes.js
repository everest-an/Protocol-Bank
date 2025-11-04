const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route POST /api/v1/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/v1/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /api/v1/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route POST /api/v1/auth/refresh
 * @desc 刷新token
 * @access Private
 */
router.post('/refresh', authMiddleware, authController.refreshToken);

/**
 * @route POST /api/v1/auth/change-password
 * @desc 修改密码
 * @access Private
 */
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
