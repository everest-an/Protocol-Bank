const { pool: db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * KYC (Know Your Customer) Service
 * 实现身份验证、文档管理、风险评估等KYC功能
 */
class KYCService {
  constructor() {
    this.riskThresholds = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 90
    };
  }

  /**
   * 创建KYC申请
   */
  async createApplication(data) {
    try {
      const applicationId = uuidv4();
      
      await db.query(
        `INSERT INTO kyc_applications 
         (application_id, account_id, application_type, status)
         VALUES ($1, $2, $3, $4)`,
        [applicationId, data.account_id, data.application_type, 'pending']
      );

      // 记录审核历史
      await this.addReviewHistory({
        application_id: applicationId,
        reviewer: 'system',
        action: 'submitted',
        new_status: 'pending',
        comments: 'Application created'
      });

      logger.info(`KYC application created: ${applicationId}`);
      return applicationId;
    } catch (error) {
      logger.error('Error creating KYC application:', error);
      throw error;
    }
  }

  /**
   * 提交个人KYC信息
   */
  async submitIndividualInfo(applicationId, data) {
    try {
      await db.query(
        `INSERT INTO kyc_individual_info 
         (application_id, first_name, middle_name, last_name, date_of_birth, 
          nationality, country_of_residence, phone_number, email, occupation, 
          employer, annual_income, source_of_funds, purpose_of_account, is_pep, pep_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (application_id) 
         DO UPDATE SET
           first_name = $2, middle_name = $3, last_name = $4, date_of_birth = $5,
           nationality = $6, country_of_residence = $7, phone_number = $8, email = $9,
           occupation = $10, employer = $11, annual_income = $12, source_of_funds = $13,
           purpose_of_account = $14, is_pep = $15, pep_details = $16`,
        [
          applicationId, data.first_name, data.middle_name, data.last_name,
          data.date_of_birth, data.nationality, data.country_of_residence,
          data.phone_number, data.email, data.occupation, data.employer,
          data.annual_income, data.source_of_funds, data.purpose_of_account,
          data.is_pep || false, data.pep_details
        ]
      );

      logger.info(`Individual KYC info submitted: ${applicationId}`);
    } catch (error) {
      logger.error('Error submitting individual KYC info:', error);
      throw error;
    }
  }

  /**
   * 提交企业KYC信息
   */
  async submitBusinessInfo(applicationId, data) {
    try {
      await db.query(
        `INSERT INTO kyc_business_info 
         (application_id, business_name, business_type, registration_number, 
          registration_country, incorporation_date, business_address, industry, 
          annual_revenue, number_of_employees, website, description, 
          beneficial_owners, directors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (application_id)
         DO UPDATE SET
           business_name = $2, business_type = $3, registration_number = $4,
           registration_country = $5, incorporation_date = $6, business_address = $7,
           industry = $8, annual_revenue = $9, number_of_employees = $10,
           website = $11, description = $12, beneficial_owners = $13, directors = $14`,
        [
          applicationId, data.business_name, data.business_type, data.registration_number,
          data.registration_country, data.incorporation_date, data.business_address,
          data.industry, data.annual_revenue, data.number_of_employees,
          data.website, data.description,
          JSON.stringify(data.beneficial_owners || []),
          JSON.stringify(data.directors || [])
        ]
      );

      logger.info(`Business KYC info submitted: ${applicationId}`);
    } catch (error) {
      logger.error('Error submitting business KYC info:', error);
      throw error;
    }
  }

  /**
   * 添加地址信息
   */
  async addAddress(applicationId, addressData) {
    try {
      await db.query(
        `INSERT INTO kyc_addresses 
         (application_id, address_type, street_address, city, state_province, 
          postal_code, country, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          applicationId, addressData.address_type, addressData.street_address,
          addressData.city, addressData.state_province, addressData.postal_code,
          addressData.country, addressData.is_primary || false
        ]
      );

      logger.info(`Address added to KYC application: ${applicationId}`);
    } catch (error) {
      logger.error('Error adding address:', error);
      throw error;
    }
  }

  /**
   * 上传文档
   */
  async uploadDocument(applicationId, documentData) {
    try {
      const documentId = uuidv4();
      
      await db.query(
        `INSERT INTO kyc_documents 
         (document_id, application_id, document_type, document_number, 
          issuing_country, issue_date, expiry_date, file_path, file_type, 
          file_size, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          documentId, applicationId, documentData.document_type,
          documentData.document_number, documentData.issuing_country,
          documentData.issue_date, documentData.expiry_date,
          documentData.file_path, documentData.file_type,
          documentData.file_size, 'pending'
        ]
      );

      logger.info(`Document uploaded: ${documentId}`);
      return documentId;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * 验证文档
   */
  async verifyDocument(documentId, verifiedBy, status, notes) {
    try {
      await db.query(
        `UPDATE kyc_documents 
         SET verification_status = $1, verified_at = CURRENT_TIMESTAMP, 
             verified_by = $2, verification_notes = $3
         WHERE document_id = $4`,
        [status, verifiedBy, notes, documentId]
      );

      // 获取application_id用于审核历史
      const result = await db.query(
        'SELECT application_id FROM kyc_documents WHERE document_id = $1',
        [documentId]
      );

      if (result.rows.length > 0) {
        await this.addReviewHistory({
          application_id: result.rows[0].application_id,
          reviewer: verifiedBy,
          action: status === 'verified' ? 'document_verified' : 'document_rejected',
          comments: notes
        });
      }

      logger.info(`Document verified: ${documentId} - ${status}`);
    } catch (error) {
      logger.error('Error verifying document:', error);
      throw error;
    }
  }

  /**
   * 记录生物识别验证
   */
  async recordBiometricVerification(applicationId, verificationData) {
    try {
      const verificationId = uuidv4();
      
      await db.query(
        `INSERT INTO kyc_biometric_verifications 
         (verification_id, application_id, verification_type, verification_method, 
          verification_result, confidence_score, provider, provider_reference, verification_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          verificationId, applicationId, verificationData.verification_type,
          verificationData.verification_method, verificationData.verification_result,
          verificationData.confidence_score, verificationData.provider,
          verificationData.provider_reference,
          JSON.stringify(verificationData.verification_data || {})
        ]
      );

      logger.info(`Biometric verification recorded: ${verificationId}`);
      return verificationId;
    } catch (error) {
      logger.error('Error recording biometric verification:', error);
      throw error;
    }
  }

  /**
   * 评估KYC风险
   */
  async assessRisk(applicationId) {
    try {
      let riskScore = 0;
      const riskFactors = [];

      // 获取申请信息
      const appResult = await db.query(
        'SELECT * FROM kyc_applications WHERE application_id = $1',
        [applicationId]
      );

      if (appResult.rows.length === 0) {
        throw new Error('Application not found');
      }

      const application = appResult.rows[0];

      // 检查PEP状态
      if (application.application_type === 'individual') {
        const individualResult = await db.query(
          'SELECT is_pep, nationality, country_of_residence FROM kyc_individual_info WHERE application_id = $1',
          [applicationId]
        );

        if (individualResult.rows.length > 0) {
          const individual = individualResult.rows[0];
          
          if (individual.is_pep) {
            riskScore += 40;
            riskFactors.push({ factor: 'PEP', score: 40 });
          }

          // 检查高风险国家
          const highRiskCountries = ['PRK', 'IRN', 'SYR', 'AFG', 'MMR', 'YEM'];
          if (highRiskCountries.includes(individual.nationality) || 
              highRiskCountries.includes(individual.country_of_residence)) {
            riskScore += 30;
            riskFactors.push({ factor: 'High Risk Country', score: 30 });
          }
        }
      }

      // 检查文档完整性
      const docsResult = await db.query(
        'SELECT COUNT(*) as doc_count, SUM(CASE WHEN verification_status = \'verified\' THEN 1 ELSE 0 END) as verified_count FROM kyc_documents WHERE application_id = $1',
        [applicationId]
      );

      const docCount = parseInt(docsResult.rows[0].doc_count);
      const verifiedCount = parseInt(docsResult.rows[0].verified_count);

      if (docCount === 0) {
        riskScore += 50;
        riskFactors.push({ factor: 'No Documents', score: 50 });
      } else if (verifiedCount < docCount) {
        riskScore += 20;
        riskFactors.push({ factor: 'Unverified Documents', score: 20 });
      }

      // 检查生物识别验证
      const biometricResult = await db.query(
        'SELECT verification_result FROM kyc_biometric_verifications WHERE application_id = $1 ORDER BY performed_at DESC LIMIT 1',
        [applicationId]
      );

      if (biometricResult.rows.length === 0) {
        riskScore += 30;
        riskFactors.push({ factor: 'No Biometric Verification', score: 30 });
      } else if (biometricResult.rows[0].verification_result !== 'passed') {
        riskScore += 40;
        riskFactors.push({ factor: 'Failed Biometric Verification', score: 40 });
      }

      // 限制总分不超过100
      riskScore = Math.min(riskScore, 100);

      // 确定风险等级
      const riskLevel = this.determineRiskLevel(riskScore);

      // 保存风险评估
      await db.query(
        `INSERT INTO kyc_risk_assessments 
         (application_id, risk_score, risk_level, risk_factors, assessed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [applicationId, riskScore, riskLevel, JSON.stringify(riskFactors), 'system']
      );

      // 更新申请的风险等级
      await db.query(
        'UPDATE kyc_applications SET risk_level = $1 WHERE application_id = $2',
        [riskLevel, applicationId]
      );

      logger.info(`KYC risk assessed: ${applicationId} - ${riskLevel} (${riskScore})`);

      return {
        application_id: applicationId,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors
      };
    } catch (error) {
      logger.error('Error assessing KYC risk:', error);
      throw error;
    }
  }

  /**
   * 确定风险等级
   */
  determineRiskLevel(score) {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * 审核申请
   */
  async reviewApplication(applicationId, reviewData) {
    try {
      const { reviewer, action, status, comments } = reviewData;

      // 获取当前状态
      const currentResult = await db.query(
        'SELECT status FROM kyc_applications WHERE application_id = $1',
        [applicationId]
      );

      const previousStatus = currentResult.rows[0]?.status;

      // 更新申请状态
      await db.query(
        `UPDATE kyc_applications 
         SET status = $1, reviewed_at = CURRENT_TIMESTAMP, 
             reviewed_by = $2, review_notes = $3
         WHERE application_id = $4`,
        [status, reviewer, comments, applicationId]
      );

      // 如果被拒绝，记录拒绝原因
      if (status === 'rejected') {
        await db.query(
          'UPDATE kyc_applications SET rejection_reason = $1 WHERE application_id = $2',
          [comments, applicationId]
        );
      }

      // 记录审核历史
      await this.addReviewHistory({
        application_id: applicationId,
        reviewer,
        action,
        previous_status: previousStatus,
        new_status: status,
        comments
      });

      logger.info(`KYC application reviewed: ${applicationId} - ${status}`);
    } catch (error) {
      logger.error('Error reviewing application:', error);
      throw error;
    }
  }

  /**
   * 添加审核历史
   */
  async addReviewHistory(data) {
    try {
      await db.query(
        `INSERT INTO kyc_review_history 
         (application_id, reviewer, action, previous_status, new_status, comments)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.application_id, data.reviewer, data.action,
          data.previous_status, data.new_status, data.comments
        ]
      );
    } catch (error) {
      logger.error('Error adding review history:', error);
      // 不抛出错误，审核历史失败不应影响主流程
    }
  }

  /**
   * 获取申请详情
   */
  async getApplicationDetails(applicationId) {
    try {
      // 获取基本信息
      const appResult = await db.query(
        'SELECT * FROM kyc_applications WHERE application_id = $1',
        [applicationId]
      );

      if (appResult.rows.length === 0) {
        return null;
      }

      const application = appResult.rows[0];

      // 根据类型获取详细信息
      let details = {};
      if (application.application_type === 'individual') {
        const individualResult = await db.query(
          'SELECT * FROM kyc_individual_info WHERE application_id = $1',
          [applicationId]
        );
        details.individual_info = individualResult.rows[0];
      } else {
        const businessResult = await db.query(
          'SELECT * FROM kyc_business_info WHERE application_id = $1',
          [applicationId]
        );
        details.business_info = businessResult.rows[0];
      }

      // 获取地址
      const addressResult = await db.query(
        'SELECT * FROM kyc_addresses WHERE application_id = $1',
        [applicationId]
      );
      details.addresses = addressResult.rows;

      // 获取文档
      const docsResult = await db.query(
        'SELECT * FROM kyc_documents WHERE application_id = $1',
        [applicationId]
      );
      details.documents = docsResult.rows;

      // 获取生物识别验证
      const biometricResult = await db.query(
        'SELECT * FROM kyc_biometric_verifications WHERE application_id = $1',
        [applicationId]
      );
      details.biometric_verifications = biometricResult.rows;

      // 获取风险评估
      const riskResult = await db.query(
        'SELECT * FROM kyc_risk_assessments WHERE application_id = $1 ORDER BY assessment_date DESC LIMIT 1',
        [applicationId]
      );
      details.risk_assessment = riskResult.rows[0];

      // 获取审核历史
      const historyResult = await db.query(
        'SELECT * FROM kyc_review_history WHERE application_id = $1 ORDER BY performed_at DESC',
        [applicationId]
      );
      details.review_history = historyResult.rows;

      return {
        ...application,
        ...details
      };
    } catch (error) {
      logger.error('Error getting application details:', error);
      throw error;
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics(startDate, endDate) {
    try {
      const stats = await db.query(
        `SELECT 
           COUNT(*) as total_applications,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
           SUM(CASE WHEN application_type = 'individual' THEN 1 ELSE 0 END) as individual,
           SUM(CASE WHEN application_type = 'business' THEN 1 ELSE 0 END) as business,
           SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low_risk,
           SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium_risk,
           SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
           SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as critical_risk
         FROM kyc_applications
         WHERE submitted_at >= $1 AND submitted_at <= $2`,
        [startDate, endDate]
      );

      return stats.rows[0];
    } catch (error) {
      logger.error('Error getting KYC statistics:', error);
      throw error;
    }
  }
}

module.exports = new KYCService();
