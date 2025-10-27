/**
 * Agent 选择器组件
 * 
 * 用于在 Scheduled Payments 中选择执行 Agent
 * 显示 Agent 的声誉、验证记录等信息
 */

import React, { useState, useEffect } from 'react';
import { useAgentRegistry } from '../hooks/useAgentRegistry';
import { useReputation } from '../hooks/useReputation';
import { Star, Shield, CheckCircle } from 'lucide-react';

export const AgentSelector = ({ onSelect, selectedAgentId }) => {
  const { getAllAgents, loading: agentsLoading } = useAgentRegistry();
  const { getReputationSummary } = useReputation();
  const [agents, setAgents] = useState([]);
  const [agentReputations, setAgentReputations] = useState({});

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const allAgents = await getAllAgents(50);
    setAgents(allAgents);

    // 加载每个 Agent 的声誉
    const reputations = {};
    for (const agent of allAgents) {
      const rep = await getReputationSummary(agent.agentId);
      reputations[agent.agentId] = rep;
    }
    setAgentReputations(reputations);
  };

  const renderReputationBadge = (agentId) => {
    const rep = agentReputations[agentId];
    if (!rep || rep.count === 0) {
      return <span className="text-gray-400 text-sm">No reviews</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="ml-1 font-semibold">{rep.averageScore}/100</span>
        </div>
        <span className="text-gray-500 text-sm">({rep.count} reviews)</span>
      </div>
    );
  };

  if (agentsLoading) {
    return <div className="text-center py-4">Loading agents...</div>;
  }

  return (
    <div className="agent-selector">
      <h3 className="text-lg font-semibold mb-4">Select Payment Executor Agent</h3>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.agentId}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedAgentId === agent.agentId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(agent)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">
                    {agent.registration?.name || `Agent #${agent.agentId}`}
                  </h4>
                  {agent.registration?.supportedTrust?.includes('validation') && (
                    <Shield className="w-4 h-4 text-green-500" title="Validated" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {agent.registration?.description || 'No description'}
                </p>
                <div className="mt-2">{renderReputationBadge(agent.agentId)}</div>
              </div>
              {selectedAgentId === agent.agentId && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSelector;

