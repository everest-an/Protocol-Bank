const kycService = require('../services/kycService');
const { pool: db } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 创建KYC申请
 */
exports.createApplication = async (req, res) => {
  try {
    const { account_id, application_type } = req.body;

    if (!account_id || !application_type) {
      return res.status(400).json({
        status: 'error',
        message: 'account_id and application_type are required'
      });
    }

    const applicationId = await kycService.createApplication({
      account_id,
      application_type
    });

    res.json({
      status: 'success',
      message: 'KYC application created',
      data: { application_id: applicationId }
    });
  } catch (error) {
    logger.error('Error creating KYC application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create KYC application',
      error: error.message
    });
  }
};

/**
 * 提交个人信息
 */
exports.submitIndividualInfo = async (req, res) => {
  try {
    const { application_id } = req.params;
    await kycService.submitIndividualInfo(application_id, req.body);

    res.json({
      status: 'success',
      message: 'Individual information submitted'
    });
  } catch (error) {
    logger.error('Error submitting individual info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit individual information',
      error: error.message
    });
  }
};

/**
 * 提交企业信息
 */
exports.submitBusinessInfo = async (req, res) => {
  try {
    const { application_id } = req.params;
    await kycService.submitBusinessInfo(application_id, req.body);

    res.json({
      status: 'success',
      message: 'Business information submitted'
    });
  } catch (error) {
    logger.error('Error submitting business info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit business information',
      error: error.message
    });
  }
};

/**
 * 添加地址
 */
exports.addAddress = async (req, res) => {
  try {
    const { application_id } = req.params;
    await kycService.addAddress(application_id, req.body);

    res.json({
      status: 'success',
      message: 'Address added'
    });
  } catch (error) {
    logger.error('Error adding address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add address',
      error: error.message
    });
  }
};

/**
 * 上传文档
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { application_id } = req.params;
    const documentId = await kycService.uploadDocument(application_id, req.body);

    res.json({
      status: 'success',
      message: 'Document uploaded',
      data: { document_id: documentId }
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * 验证文档
 */
exports.verifyDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { status, notes } = req.body;
    const verifiedBy = req.user?.username || 'admin';

    await kycService.verifyDocument(document_id, verifiedBy, status, notes);

    res.json({
      status: 'success',
      message: 'Document verified'
    });
  } catch (error) {
    logger.error('Error verifying document:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify document',
      error: error.message
    });
  }
};

/**
 * 记录生物识别验证
 */
exports.recordBiometricVerification = async (req, res) => {
  try {
    const { application_id } = req.params;
    const verificationId = await kycService.recordBiometricVerification(application_id, req.body);

    res.json({
      status: 'success',
      message: 'Biometric verification recorded',
      data: { verification_id: verificationId }
    });
  } catch (error) {
    logger.error('Error recording biometric verification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record biometric verification',
      error: error.message
    });
  }
};

/**
 * 评估风险
 */
exports.assessRisk = async (req, res) => {
  try {
    const { application_id } = req.params;
    const assessment = await kycService.assessRisk(application_id);

    res.json({
      status: 'success',
      data: assessment
    });
  } catch (error) {
    logger.error('Error assessing KYC risk:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assess risk',
      error: error.message
    });
  }
};

/**
 * 审核申请
 */
exports.reviewApplication = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { action, status, comments } = req.body;
    const reviewer = req.user?.username || 'admin';

    await kycService.reviewApplication(application_id, {
      reviewer,
      action,
      status,
      comments
    });

    res.json({
      status: 'success',
      message: 'Application reviewed'
    });
  } catch (error) {
    logger.error('Error reviewing application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to review application',
      error: error.message
    });
  }
};

/**
 * 获取申请详情
 */
exports.getApplicationDetails = async (req, res) => {
  try {
    const { application_id } = req.params;
    const details = await kycService.getApplicationDetails(application_id);

    if (!details) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    res.json({
      status: 'success',
      data: details
    });
  } catch (error) {
    logger.error('Error getting application details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get application details',
      error: error.message
    });
  }
};

/**
 * 获取申请列表
 */
exports.getApplications = async (req, res) => {
  try {
    const { status, application_type, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM kyc_applications WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (application_type) {
      params.push(application_type);
      query += ` AND application_type = $${params.length}`;
    }

    query += ` ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        applications: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error getting applications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get applications',
      error: error.message
    });
  }
};

/**
 * 获取统计数据
 */
exports.getStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const endDate = end_date || new Date().toISOString();
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const stats = await kycService.getStatistics(startDate, endDate);

    res.json({
      status: 'success',
      data: {
        period: { start: startDate, end: endDate },
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Error getting KYC statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

module.exports = exports;
