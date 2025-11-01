const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');

/**
 * @route POST /api/v1/kyc/application
 * @desc 创建KYC申请
 */
router.post('/application', kycController.createApplication);

/**
 * @route POST /api/v1/kyc/application/:application_id/individual
 * @desc 提交个人KYC信息
 */
router.post('/application/:application_id/individual', kycController.submitIndividualInfo);

/**
 * @route POST /api/v1/kyc/application/:application_id/business
 * @desc 提交企业KYC信息
 */
router.post('/application/:application_id/business', kycController.submitBusinessInfo);

/**
 * @route POST /api/v1/kyc/application/:application_id/address
 * @desc 添加地址信息
 */
router.post('/application/:application_id/address', kycController.addAddress);

/**
 * @route POST /api/v1/kyc/application/:application_id/document
 * @desc 上传文档
 */
router.post('/application/:application_id/document', kycController.uploadDocument);

/**
 * @route POST /api/v1/kyc/document/:document_id/verify
 * @desc 验证文档
 */
router.post('/document/:document_id/verify', kycController.verifyDocument);

/**
 * @route POST /api/v1/kyc/application/:application_id/biometric
 * @desc 记录生物识别验证
 */
router.post('/application/:application_id/biometric', kycController.recordBiometricVerification);

/**
 * @route POST /api/v1/kyc/application/:application_id/assess
 * @desc 评估KYC风险
 */
router.post('/application/:application_id/assess', kycController.assessRisk);

/**
 * @route POST /api/v1/kyc/application/:application_id/review
 * @desc 审核KYC申请
 */
router.post('/application/:application_id/review', kycController.reviewApplication);

/**
 * @route GET /api/v1/kyc/application/:application_id
 * @desc 获取KYC申请详情
 */
router.get('/application/:application_id', kycController.getApplicationDetails);

/**
 * @route GET /api/v1/kyc/applications
 * @desc 获取KYC申请列表
 */
router.get('/applications', kycController.getApplications);

/**
 * @route GET /api/v1/kyc/statistics
 * @desc 获取KYC统计数据
 */
router.get('/statistics', kycController.getStatistics);

module.exports = router;
