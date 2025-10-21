import React, { useState } from 'react';
import { Calendar, Clock, List, Workflow, Info, Play, Pause, Trash2, Edit2 } from 'lucide-react';
import PaymentFlowBuilder from '../components/PaymentFlowBuilder';

export default function ScheduledPaymentV2() {
  const [viewMode, setViewMode] = useState('builder'); // builder, list
  const [deployedFlows, setDeployedFlows] = useState([
    {
      id: 1,
      name: 'Monthly Salary Payment',
      description: 'Automatically pay salaries on the 1st of each month',
      status: 'active',
      nextExecution: '2025-11-01 00:00:00',
      executedCount: 12,
      lastExecution: '2025-10-01 00:00:00',
      createdAt: '2025-01-01'
    },
    {
      id: 2,
      name: 'AI-Driven Supplier Payment',
      description: 'AI analyzes invoices and triggers payment',
      status: 'active',
      nextExecution: 'On AI trigger',
      executedCount: 45,
      lastExecution: '2025-10-20 14:30:00',
      createdAt: '2025-03-15'
    },
    {
      id: 3,
      name: 'Chainlink Price Trigger',
      description: 'Execute payment when ETH > $3000',
      status: 'paused',
      nextExecution: 'Waiting for condition',
      executedCount: 3,
      lastExecution: '2025-09-15 10:20:00',
      createdAt: '2025-08-01'
    }
  ]);

  const handleDeploy = (flowData) => {
    const newFlow = {
      id: Date.now(),
      name: `Flow ${deployedFlows.length + 1}`,
      description: 'Custom payment flow',
      status: 'active',
      nextExecution: 'Pending',
      executedCount: 0,
      lastExecution: '-',
      createdAt: new Date().toISOString().split('T')[0],
      flowData
    };
    setDeployedFlows([newFlow, ...deployedFlows]);
  };

  const toggleFlowStatus = (id) => {
    setDeployedFlows(deployedFlows.map(flow => 
      flow.id === id 
        ? { ...flow, status: flow.status === 'active' ? 'paused' : 'active' }
        : flow
    ));
  };

  const deleteFlow = (id) => {
    if (confirm('Are you sure you want to delete this flow?')) {
      setDeployedFlows(deployedFlows.filter(flow => flow.id !== id));
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Payments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create automated payment flows with visual programming
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'builder'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Flow Builder
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              Deployed Flows
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'builder' ? (
          <PaymentFlowBuilder onDeploy={handleDeploy} />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Automated Payment Flows
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    These flows are deployed and running automatically based on their trigger conditions.
                    You can pause, edit, or delete them at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Flows</span>
                  <Workflow className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deployedFlows.length}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                  <Play className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deployedFlows.filter(f => f.status === 'active').length}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Paused</span>
                  <Pause className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deployedFlows.filter(f => f.status === 'paused').length}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Executions</span>
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deployedFlows.reduce((sum, f) => sum + f.executedCount, 0)}
                </div>
              </div>
            </div>

            {/* Deployed Flows List */}
            <div className="space-y-4">
              {deployedFlows.map(flow => (
                <div
                  key={flow.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {flow.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          flow.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {flow.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {flow.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Next Execution</span>
                          <div className="font-medium text-gray-900 dark:text-white mt-1">
                            {flow.nextExecution}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Last Execution</span>
                          <div className="font-medium text-gray-900 dark:text-white mt-1">
                            {flow.lastExecution}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Executed Count</span>
                          <div className="font-medium text-gray-900 dark:text-white mt-1">
                            {flow.executedCount} times
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Created</span>
                          <div className="font-medium text-gray-900 dark:text-white mt-1">
                            {flow.createdAt}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleFlowStatus(flow.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          flow.status === 'active'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                        }`}
                        title={flow.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {flow.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setViewMode('builder')}
                        className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFlow(flow.id)}
                        className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {deployedFlows.length === 0 && (
                <div className="text-center py-12">
                  <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No deployed flows yet. Switch to Flow Builder to create your first automated payment flow.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

