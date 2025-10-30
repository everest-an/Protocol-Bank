/**
 * Agent 注册组件
 * 
 * 允许用户注册新的 ERC-8004 Agent
 * 用于创建支付执行器、验证器等 AI Agent
 */

import React, { useState } from 'react';
import { useAgentRegistry } from '../hooks/useAgentRegistry';
import { useWeb3 } from '../hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import './AgentRegistration.css';

// ============================================================================
// AgentRegistration 组件
// ============================================================================

export const AgentRegistration = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { account, chainId } = useWeb3();
  const { registerAgent, loading, error } = useAgentRegistry();

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    agentType: 'executor', // executor, validator, oracle
    supportedServices: {
      scheduledPayments: true,
      batchPayments: false,
      flowPayments: false,
    },
  });

  const [step, setStep] = useState(1); // 1: 基本信息, 2: 服务配置, 3: 确认
  const [registrationResult, setRegistrationResult] = useState(null);

  // ============================================================================
  // 表单处理
  // ============================================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData((prev) => ({
      ...prev,
      supportedServices: {
        ...prev.supportedServices,
        [service]: !prev.supportedServices[service],
      },
    }));
  };

  // ============================================================================
  // 注册处理
  // ============================================================================

  const handleRegister = async () => {
    try {
      // 构建 Agent 数据
      const agentData = {
        name: formData.name,
        description: formData.description,
        image: formData.image || 'https://via.placeholder.com/200',
        endpoints: [
          {
            name: 'agentWallet',
            endpoint: `eip155:${chainId}:${account}`,
          },
        ],
        supportedTrust: ['reputation', 'validation'],
        metadata: [
          {
            key: 'agentType',
            value: formData.agentType,
          },
          {
            key: 'supportedServices',
            value: JSON.stringify(formData.supportedServices),
          },
        ],
      };

      // 注册 Agent
      const result = await registerAgent(agentData);
      setRegistrationResult(result);

      // 通知父组件
      if (onSuccess) {
        onSuccess(result);
      }

      // 进入成功页面
      setStep(4);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  // ============================================================================
  // 渲染步骤
  // ============================================================================

  const renderStep1 = () => (
    <div className="registration-step">
      <h3>{t('agent.registration.step1.title', 'Basic Information')}</h3>
      <p className="step-description">
        {t(
          'agent.registration.step1.description',
          'Provide basic information about your AI Agent'
        )}
      </p>

      <div className="form-group">
        <label htmlFor="name">
          {t('agent.registration.name', 'Agent Name')} *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder={t(
            'agent.registration.namePlaceholder',
            'e.g., Payment Executor Pro'
          )}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">
          {t('agent.registration.description', 'Description')} *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={t(
            'agent.registration.descriptionPlaceholder',
            'Describe what your agent does, its capabilities, and pricing...'
          )}
          rows={4}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="image">
          {t('agent.registration.image', 'Agent Image URL')}
        </label>
        <input
          type="url"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleInputChange}
          placeholder="https://example.com/agent-avatar.png"
        />
        {formData.image && (
          <div className="image-preview">
            <img src={formData.image} alt="Agent preview" />
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="agentType">
          {t('agent.registration.type', 'Agent Type')} *
        </label>
        <select
          id="agentType"
          name="agentType"
          value={formData.agentType}
          onChange={handleInputChange}
        >
          <option value="executor">
            {t('agent.type.executor', 'Payment Executor')}
          </option>
          <option value="validator">
            {t('agent.type.validator', 'Validator')}
          </option>
          <option value="oracle">{t('agent.type.oracle', 'Oracle')}</option>
        </select>
      </div>

      <div className="step-actions">
        <button
          className="btn btn-primary"
          onClick={() => setStep(2)}
          disabled={!formData.name || !formData.description}
        >
          {t('common.next', 'Next')} →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="registration-step">
      <h3>{t('agent.registration.step2.title', 'Service Configuration')}</h3>
      <p className="step-description">
        {t(
          'agent.registration.step2.description',
          'Select which payment services your agent supports'
        )}
      </p>

      <div className="services-list">
        <div className="service-item">
          <input
            type="checkbox"
            id="scheduledPayments"
            checked={formData.supportedServices.scheduledPayments}
            onChange={() => handleServiceToggle('scheduledPayments')}
          />
          <label htmlFor="scheduledPayments">
            <div className="service-name">
              {t('agent.service.scheduled', 'Scheduled Payments')}
            </div>
            <div className="service-description">
              {t(
                'agent.service.scheduledDesc',
                'Execute payments at scheduled times'
              )}
            </div>
          </label>
        </div>

        <div className="service-item">
          <input
            type="checkbox"
            id="batchPayments"
            checked={formData.supportedServices.batchPayments}
            onChange={() => handleServiceToggle('batchPayments')}
          />
          <label htmlFor="batchPayments">
            <div className="service-name">
              {t('agent.service.batch', 'Batch Payments')}
            </div>
            <div className="service-description">
              {t(
                'agent.service.batchDesc',
                'Process multiple payments in a single transaction'
              )}
            </div>
          </label>
        </div>

        <div className="service-item">
          <input
            type="checkbox"
            id="flowPayments"
            checked={formData.supportedServices.flowPayments}
            onChange={() => handleServiceToggle('flowPayments')}
          />
          <label htmlFor="flowPayments">
            <div className="service-name">
              {t('agent.service.flow', 'Flow Payments')}
            </div>
            <div className="service-description">
              {t(
                'agent.service.flowDesc',
                'Manage continuous payment streams'
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => setStep(1)}>
          ← {t('common.back', 'Back')}
        </button>
        <button className="btn btn-primary" onClick={() => setStep(3)}>
          {t('common.next', 'Next')} →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="registration-step">
      <h3>{t('agent.registration.step3.title', 'Confirm Registration')}</h3>
      <p className="step-description">
        {t(
          'agent.registration.step3.description',
          'Review your agent information before registering'
        )}
      </p>

      <div className="confirmation-summary">
        <div className="summary-section">
          <h4>{t('agent.registration.basicInfo', 'Basic Information')}</h4>
          <div className="summary-item">
            <span className="label">{t('agent.registration.name', 'Name')}:</span>
            <span className="value">{formData.name}</span>
          </div>
          <div className="summary-item">
            <span className="label">
              {t('agent.registration.type', 'Type')}:
            </span>
            <span className="value">{formData.agentType}</span>
          </div>
          <div className="summary-item">
            <span className="label">
              {t('agent.registration.description', 'Description')}:
            </span>
            <span className="value">{formData.description}</span>
          </div>
        </div>

        <div className="summary-section">
          <h4>{t('agent.registration.supportedServices', 'Supported Services')}</h4>
          <ul className="services-summary">
            {formData.supportedServices.scheduledPayments && (
              <li>✓ {t('agent.service.scheduled', 'Scheduled Payments')}</li>
            )}
            {formData.supportedServices.batchPayments && (
              <li>✓ {t('agent.service.batch', 'Batch Payments')}</li>
            )}
            {formData.supportedServices.flowPayments && (
              <li>✓ {t('agent.service.flow', 'Flow Payments')}</li>
            )}
          </ul>
        </div>

        <div className="info-box">
          <p>
            {t(
              'agent.registration.gasFee',
              'Registration requires a transaction on the blockchain. You will need to pay gas fees.'
            )}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="step-actions">
        <button
          className="btn btn-secondary"
          onClick={() => setStep(2)}
          disabled={loading}
        >
          ← {t('common.back', 'Back')}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleRegister}
          disabled={loading || !account}
        >
          {loading
            ? t('agent.registration.registering', 'Registering...')
            : t('agent.registration.register', 'Register Agent')}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="registration-step success-step">
      <div className="success-icon">✓</div>
      <h3>{t('agent.registration.success.title', 'Agent Registered Successfully!')}</h3>
      <p className="success-message">
        {t(
          'agent.registration.success.message',
          'Your AI Agent has been registered on the ERC-8004 registry.'
        )}
      </p>

      {registrationResult && (
        <div className="registration-details">
          <div className="detail-item">
            <span className="label">Agent ID:</span>
            <span className="value">{registrationResult.agentId}</span>
          </div>
          <div className="detail-item">
            <span className="label">Transaction:</span>
            <span className="value">
              <a
                href={`https://sepolia.etherscan.io/tx/${registrationResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {registrationResult.txHash.slice(0, 10)}...
                {registrationResult.txHash.slice(-8)}
              </a>
            </span>
          </div>
          <div className="detail-item">
            <span className="label">IPFS URI:</span>
            <span className="value ipfs-uri">
              {registrationResult.ipfsUri}
            </span>
          </div>
        </div>
      )}

      <div className="next-steps">
        <h4>{t('agent.registration.nextSteps', 'Next Steps')}</h4>
        <ul>
          <li>
            {t(
              'agent.registration.step.buildReputation',
              'Start building your agent reputation by completing tasks'
            )}
          </li>
          <li>
            {t(
              'agent.registration.step.getValidated',
              'Get your work validated by trusted validators'
            )}
          </li>
          <li>
            {t(
              'agent.registration.step.earnTrust',
              'Earn trust and attract more clients'
            )}
          </li>
        </ul>
      </div>

      <div className="step-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            setStep(1);
            setFormData({
              name: '',
              description: '',
              image: '',
              agentType: 'executor',
              supportedServices: {
                scheduledPayments: true,
                batchPayments: false,
                flowPayments: false,
              },
            });
            setRegistrationResult(null);
          }}
        >
          {t('agent.registration.registerAnother', 'Register Another Agent')}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // 主渲染
  // ============================================================================

  if (!account) {
    return (
      <div className="agent-registration">
        <div className="connect-wallet-prompt">
          <p>{t('agent.registration.connectWallet', 'Please connect your wallet to register an agent.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-registration">
      <div className="registration-header">
        <h2>{t('agent.registration.title', 'Register AI Agent')}</h2>
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>
      </div>

      <div className="registration-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
};

// ============================================================================
// 导出
// ============================================================================

export default AgentRegistration;

