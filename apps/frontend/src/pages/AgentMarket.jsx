import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentRegistry } from '../hooks/useAgentRegistry';
import { useReputation } from '../hooks/useReputation';
import { Link } from 'react-router-dom';
import AgentRegistration from '../components/AgentRegistration';
import './AgentMarket.css';

/**
 * Agent 市场页面
 * 
 * 功能：
 * 1. 展示所有已注册的 Agent
 * 2. 按声誉、类型、服务筛选
 * 3. 搜索 Agent
 * 4. 注册新 Agent
 * 5. 查看 Agent 详情
 * 
 * @component
 */
const AgentMarket = () => {
  const { t } = useTranslation();
  const { getAllAgents, loading: agentsLoading } = useAgentRegistry();
  const { getAgentReputation } = useReputation();

  // State
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('reputation'); // reputation, name, recent
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载所有 Agent
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const allAgents = await getAllAgents();
      
      // 为每个 Agent 加载声誉信息
      const agentsWithReputation = await Promise.all(
        allAgents.map(async (agent) => {
          try {
            const reputation = await getAgentReputation(agent.id);
            return {
              ...agent,
              reputation: reputation || { averageScore: 0, totalReviews: 0 },
            };
          } catch (error) {
            console.error(`Failed to load reputation for agent ${agent.id}:`, error);
            return {
              ...agent,
              reputation: { averageScore: 0, totalReviews: 0 },
            };
          }
        })
      );

      setAgents(agentsWithReputation);
      setFilteredAgents(agentsWithReputation);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选
  useEffect(() => {
    let result = [...agents];

    // 搜索
    if (searchTerm) {
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 类型筛选
    if (filterType !== 'all') {
      result = result.filter((agent) => agent.agentType === filterType);
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'reputation':
          return (b.reputation?.averageScore || 0) - (a.reputation?.averageScore || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.id - a.id; // 假设 ID 越大越新
        default:
          return 0;
      }
    });

    setFilteredAgents(result);
  }, [searchTerm, filterType, sortBy, agents]);

  // Agent 卡片组件
  const AgentCard = ({ agent }) => {
    const { id, name, description, imageUrl, agentType, reputation } = agent;
    const { averageScore = 0, totalReviews = 0 } = reputation || {};

    return (
      <Link
        to={`/agent/${id}`}
        className="agent-card"
      >
        <div className="agent-card-image">
          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className="agent-card-placeholder">
              <span className="agent-icon">🤖</span>
            </div>
          )}
          <div className="agent-card-badge">{agentType}</div>
        </div>

        <div className="agent-card-content">
          <h3 className="agent-card-title">{name}</h3>
          <p className="agent-card-description">{description}</p>

          <div className="agent-card-stats">
            <div className="agent-stat">
              <span className="agent-stat-label">{t('agent.reputation')}</span>
              <div className="agent-stat-value">
                <span className="agent-score">{averageScore.toFixed(1)}</span>
                <span className="agent-score-max">/100</span>
              </div>
            </div>

            <div className="agent-stat">
              <span className="agent-stat-label">{t('agent.reviews')}</span>
              <div className="agent-stat-value">
                <span className="agent-reviews">{totalReviews}</span>
                <span className="agent-reviews-label">
                  {totalReviews > 0 ? t('agent.reviews') : t('agent.noReviews')}
                </span>
              </div>
            </div>
          </div>

          {averageScore >= 80 && (
            <div className="agent-card-verified">
              <span className="verified-icon">✓</span>
              <span>{t('agent.validated')}</span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="agent-market">
      {/* Header */}
      <div className="agent-market-header">
        <div className="agent-market-title-section">
          <h1 className="agent-market-title">{t('agent.title')}</h1>
          <p className="agent-market-subtitle">{t('agent.subtitle')}</p>
        </div>

        <button
          className="btn-register-agent"
          onClick={() => setShowRegistration(true)}
        >
          <span className="btn-icon">+</span>
          {t('agent.register')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="agent-market-controls">
        <div className="agent-search">
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="agent-search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="agent-filters">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="agent-filter-select"
          >
            <option value="all">{t('categories.all')}</option>
            <option value="payment_executor">Payment Executor</option>
            <option value="validator">Validator</option>
            <option value="oracle">Oracle</option>
            <option value="aggregator">Aggregator</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="agent-sort-select"
          >
            <option value="reputation">Sort by Reputation</option>
            <option value="name">Sort by Name</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="agent-market-stats">
        <div className="agent-stat-card">
          <span className="stat-value">{agents.length}</span>
          <span className="stat-label">{t('agent.allAgents')}</span>
        </div>
        <div className="agent-stat-card">
          <span className="stat-value">{filteredAgents.length}</span>
          <span className="stat-label">Filtered</span>
        </div>
        <div className="agent-stat-card">
          <span className="stat-value">
            {agents.filter((a) => (a.reputation?.averageScore || 0) >= 80).length}
          </span>
          <span className="stat-label">{t('agent.validated')}</span>
        </div>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="agent-market-loading">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="agent-grid">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="agent-market-empty">
          <span className="empty-icon">🤖</span>
          <h3>No agents found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <div className="modal-overlay" onClick={() => setShowRegistration(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowRegistration(false)}
            >
              ×
            </button>
            <AgentRegistration
              onSuccess={() => {
                setShowRegistration(false);
                loadAgents(); // 重新加载 Agent 列表
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentMarket;

