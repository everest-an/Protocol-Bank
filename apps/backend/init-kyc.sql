-- KYC (Know Your Customer) Module Database Schema

-- KYC申请表
CREATE TABLE IF NOT EXISTS kyc_applications (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL UNIQUE,
  account_id UUID NOT NULL,
  application_type VARCHAR(50) NOT NULL CHECK (application_type IN ('individual', 'business')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'additional_info_required')),
  risk_level VARCHAR(50) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  review_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 个人KYC信息表
CREATE TABLE IF NOT EXISTS kyc_individual_info (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL UNIQUE REFERENCES kyc_applications(application_id),
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(3) NOT NULL, -- ISO 3166-1 alpha-3
  country_of_residence VARCHAR(3) NOT NULL,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  occupation VARCHAR(255),
  employer VARCHAR(255),
  annual_income DECIMAL(20, 2),
  source_of_funds TEXT,
  purpose_of_account TEXT,
  is_pep BOOLEAN DEFAULT FALSE, -- Politically Exposed Person
  pep_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企业KYC信息表
CREATE TABLE IF NOT EXISTS kyc_business_info (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL UNIQUE REFERENCES kyc_applications(application_id),
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL, -- corporation, partnership, sole_proprietorship, etc.
  registration_number VARCHAR(255) NOT NULL,
  registration_country VARCHAR(3) NOT NULL,
  incorporation_date DATE,
  business_address TEXT NOT NULL,
  industry VARCHAR(255),
  annual_revenue DECIMAL(20, 2),
  number_of_employees INTEGER,
  website VARCHAR(255),
  description TEXT,
  beneficial_owners JSONB, -- Array of beneficial owner information
  directors JSONB, -- Array of director information
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地址信息表
CREATE TABLE IF NOT EXISTS kyc_addresses (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL REFERENCES kyc_applications(application_id),
  address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('residential', 'business', 'mailing')),
  street_address TEXT NOT NULL,
  city VARCHAR(255) NOT NULL,
  state_province VARCHAR(255),
  postal_code VARCHAR(50),
  country VARCHAR(3) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文档表
CREATE TABLE IF NOT EXISTS kyc_documents (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL UNIQUE,
  application_id VARCHAR(255) NOT NULL REFERENCES kyc_applications(application_id),
  document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
    'passport', 'national_id', 'drivers_license', 'residence_permit',
    'utility_bill', 'bank_statement', 'tax_return',
    'business_license', 'articles_of_incorporation', 'certificate_of_good_standing',
    'proof_of_address', 'selfie', 'other'
  )),
  document_number VARCHAR(255),
  issuing_country VARCHAR(3),
  issue_date DATE,
  expiry_date DATE,
  file_path VARCHAR(500),
  file_type VARCHAR(50),
  file_size INTEGER,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  verification_notes TEXT,
  ocr_data JSONB, -- Extracted data from OCR
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生物识别验证表
CREATE TABLE IF NOT EXISTS kyc_biometric_verifications (
  id SERIAL PRIMARY KEY,
  verification_id VARCHAR(255) NOT NULL UNIQUE,
  application_id VARCHAR(255) NOT NULL REFERENCES kyc_applications(application_id),
  verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('face_recognition', 'liveness_detection', 'fingerprint', 'voice')),
  verification_method VARCHAR(100), -- e.g., "selfie_with_id", "video_call", "third_party_service"
  verification_result VARCHAR(50) CHECK (verification_result IN ('passed', 'failed', 'pending', 'manual_review')),
  confidence_score DECIMAL(5, 2), -- 0-100
  provider VARCHAR(100), -- e.g., "Onfido", "Jumio", "Veriff"
  provider_reference VARCHAR(255),
  verification_data JSONB,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审核历史表
CREATE TABLE IF NOT EXISTS kyc_review_history (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL REFERENCES kyc_applications(application_id),
  reviewer VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'in_review', 'approved', 'rejected', 'additional_info_requested', 'document_verified', 'document_rejected')),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  comments TEXT,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC风险评估表
CREATE TABLE IF NOT EXISTS kyc_risk_assessments (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL REFERENCES kyc_applications(application_id),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB, -- Detailed risk factors
  pep_check BOOLEAN DEFAULT FALSE,
  sanctions_check BOOLEAN DEFAULT FALSE,
  adverse_media_check BOOLEAN DEFAULT FALSE,
  assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assessed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC刷新记录表（定期复审）
CREATE TABLE IF NOT EXISTS kyc_refresh_records (
  id SERIAL PRIMARY KEY,
  account_id UUID NOT NULL,
  refresh_type VARCHAR(50) NOT NULL CHECK (refresh_type IN ('periodic', 'triggered', 'manual')),
  trigger_reason TEXT,
  due_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_kyc_applications_account ON kyc_applications(account_id);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_status ON kyc_applications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_type ON kyc_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_submitted ON kyc_applications(submitted_at);

CREATE INDEX IF NOT EXISTS idx_kyc_individual_application ON kyc_individual_info(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_business_application ON kyc_business_info(application_id);

CREATE INDEX IF NOT EXISTS idx_kyc_addresses_application ON kyc_addresses(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_addresses_type ON kyc_addresses(address_type);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_application ON kyc_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_type ON kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(verification_status);

CREATE INDEX IF NOT EXISTS idx_kyc_biometric_application ON kyc_biometric_verifications(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_biometric_result ON kyc_biometric_verifications(verification_result);

CREATE INDEX IF NOT EXISTS idx_kyc_review_application ON kyc_review_history(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_review_date ON kyc_review_history(performed_at);

CREATE INDEX IF NOT EXISTS idx_kyc_risk_application ON kyc_risk_assessments(application_id);
CREATE INDEX IF NOT EXISTS idx_kyc_risk_level ON kyc_risk_assessments(risk_level);

CREATE INDEX IF NOT EXISTS idx_kyc_refresh_account ON kyc_refresh_records(account_id);
CREATE INDEX IF NOT EXISTS idx_kyc_refresh_status ON kyc_refresh_records(status);
CREATE INDEX IF NOT EXISTS idx_kyc_refresh_due_date ON kyc_refresh_records(due_date);

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_kyc_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kyc_applications_updated_at BEFORE UPDATE ON kyc_applications FOR EACH ROW EXECUTE FUNCTION update_kyc_updated_at_column();
CREATE TRIGGER update_kyc_individual_info_updated_at BEFORE UPDATE ON kyc_individual_info FOR EACH ROW EXECUTE FUNCTION update_kyc_updated_at_column();
CREATE TRIGGER update_kyc_business_info_updated_at BEFORE UPDATE ON kyc_business_info FOR EACH ROW EXECUTE FUNCTION update_kyc_updated_at_column();
CREATE TRIGGER update_kyc_addresses_updated_at BEFORE UPDATE ON kyc_addresses FOR EACH ROW EXECUTE FUNCTION update_kyc_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE FUNCTION update_kyc_updated_at_column();
CREATE TRIGGER update_kyc_refresh_records_updated_at BEFORE UPDATE ON kyc_refresh_records FOR EACH ROW EXECUTE FUNCTION update_kyc_updated_at_column();

-- 插入示例数据（可选）
-- 这里可以添加一些示例的KYC申请用于测试

-- 完成
SELECT 'KYC database schema initialized successfully' AS status;
