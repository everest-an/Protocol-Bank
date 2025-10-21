import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  TrendingUp, Users, DollarSign, Activity, Lock, CheckCircle, Clock,
  AlertCircle, ArrowRight, Play, Pause, RotateCcw, Zap
} from 'lucide-react';
import EscrowPoolCard from '../components/stake/EscrowPoolCard';
import WhitelistManager from '../components/stake/WhitelistManager';
import PaymentHistoryTable from '../components/stake/PaymentHistoryTable';
import StakePaymentVisualization from '../components/stake/StakePaymentVisualization';
import {
  generateFlowPaymentMockData,
  getAutoInteractionSteps,
  generateVisualizationData,
  calculateStatistics
} from '../utils/flowPaymentMockData';

export default function DashboardWithFlowPayment() {
  const [mockData, setMockData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRole, setActiveRole] = useState('both'); // 'vc', 'company', or 'both'

  // Initialize mock data
  useEffect(() => {
    const data = generateFlowPaymentMockData();
    setMockData(data);
    
    const stats = calculateStatistics(data.poolData, data.payments, data.whitelist);
    setStatistics(stats);
    
    const vizData = generateVisualizationData(data.payments, data.whitelist);
    setVisualizationData(vizData);
  }, []);

  // Auto-play workflow
  useEffect(() => {
    if (!autoPlayEnabled || !isPlaying) return;

    const steps = getAutoInteractionSteps();
    if (currentStep >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, steps[currentStep]?.duration || 2000);

    return () => clearTimeout(timer);
  }, [autoPlayEnabled, isPlaying, currentStep]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const steps = getAutoInteractionSteps();
  const currentStepData = steps[currentStep];

  if (!mockData || !statistics || !visualizationData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Flow Payment (Stake)</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Escrow-based payment system with full traceability for VC/LP fund monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlayPause}
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause Demo
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Play Demo
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Auto-play Progress */}
        {autoPlayEnabled && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="font-medium">Auto-Demo Mode</span>
              </div>
              <span className="text-sm text-blue-100">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            
            {currentStepData && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentStepData.role === 'VC/LP' ? 'bg-blue-500' :
                      currentStepData.role === 'Company' ? 'bg-purple-500' :
                      'bg-green-500'
                    }`}>
                      {currentStepData.role}
                    </span>
                    <span className="font-medium">{currentStepData.action}</span>
                  </div>
                  <p className="text-sm text-blue-100">{currentStepData.description}</p>
                </div>
                <ArrowRight className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
            )}

            {/* Progress Bar */}
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Staked</span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalStaked} ETH
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Locked in escrow
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalSpent} ETH
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {statistics.utilizationRate.toFixed(1)}% utilization
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.availableBalance} ETH
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ready to use
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Suppliers</span>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.approvedSuppliers}/{statistics.totalSuppliers}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {statistics.pendingSuppliers} pending approval
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Selector */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View as:</span>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveRole('vc')}
            variant={activeRole === 'vc' ? 'default' : 'outline'}
            size="sm"
            className={activeRole === 'vc' ? 'bg-blue-600 text-white' : ''}
          >
            VC/LP
          </Button>
          <Button
            onClick={() => setActiveRole('company')}
            variant={activeRole === 'company' ? 'default' : 'outline'}
            size="sm"
            className={activeRole === 'company' ? 'bg-purple-600 text-white' : ''}
          >
            Company
          </Button>
          <Button
            onClick={() => setActiveRole('both')}
            variant={activeRole === 'both' ? 'default' : 'outline'}
            size="sm"
            className={activeRole === 'both' ? 'bg-green-600 text-white' : ''}
          >
            Both (Demo)
          </Button>
        </div>
      </div>

      {/* Payment Flow Visualization */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Flow Network
          </h3>
          <StakePaymentVisualization
            poolData={mockData.poolData}
            whitelist={mockData.whitelist}
            payments={mockData.payments}
          />
        </CardContent>
      </Card>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pool & Whitelist */}
        <div className="space-y-6">
          {/* Escrow Pool Card */}
          {(activeRole === 'vc' || activeRole === 'both') && (
            <EscrowPoolCard
              poolData={mockData.poolData}
              userRole="staker"
              testMode={true}
            />
          )}

          {(activeRole === 'company' || activeRole === 'both') && (
            <EscrowPoolCard
              poolData={mockData.poolData}
              userRole="company"
              testMode={true}
            />
          )}

          {/* Whitelist Manager */}
          <WhitelistManager
            poolId={mockData.poolData.poolId}
            whitelist={mockData.whitelist}
            userRole={activeRole === 'vc' ? 'staker' : 'company'}
            testMode={true}
          />
        </div>

        {/* Right: Payment History & Stats */}
        <div className="space-y-6">
          {/* Payment History */}
          <PaymentHistoryTable
            payments={mockData.payments}
            testMode={true}
          />

          {/* Category Breakdown */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Spending by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(statistics.categoryStats).map(([category, data]) => {
                  const percentage = (data.amount / statistics.totalSpent) * 100;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {category}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {data.amount.toFixed(2)} ETH ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {data.count} payments
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {statistics.paymentCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Payments
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {statistics.avgPayment.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Payment (ETH)
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {statistics.approvedSuppliers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Approved Suppliers
                  </div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {statistics.pendingSuppliers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pending Approval
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium mb-1">🎯 Demo Mode Active</p>
              <p>
                This is an interactive demonstration of Flow Payment (Stake). All data is simulated to showcase
                the complete workflow between VC/LP and Company. In production, this connects to real smart contracts
                on Sepolia testnet. Click "Play Demo" to see the automated workflow in action!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

