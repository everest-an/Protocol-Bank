import { useState } from 'react';
import { Workflow, Bot, Calendar, Zap } from 'lucide-react';
import ScheduledPaymentV2 from './ScheduledPaymentV2';
import AgentMarket from './AgentMarket';

export default function Automation() {
  const [activeTab, setActiveTab] = useState('scheduled'); // scheduled, agents

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-6 h-6" />
                Payment Automation
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                Automate your payments with scheduled flows and AI agents
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'scheduled'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Scheduled Payments
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'agents'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Agents
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto">
        {activeTab === 'scheduled' && <ScheduledPaymentV2 />}
        {activeTab === 'agents' && <AgentMarket />}
      </div>
    </div>
  );
}
