import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

/**
 * 懒加载路由配置
 * 
 * 使用 React.lazy() 和 Suspense 实现路由级别的代码分割
 * 
 * 优势：
 * 1. 减小初始加载包大小
 * 2. 按需加载页面组件
 * 3. 提升首屏加载速度
 * 4. 改善用户体验
 */

// Loading 组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// 懒加载页面组件
const FlowPaymentVisualization = lazy(() => 
  import('../pages/FlowPaymentVisualization')
);

const FlowPaymentStakePage = lazy(() => 
  import('../pages/FlowPaymentStakePage')
);

const BatchPayment = lazy(() => 
  import('../pages/BatchPayment')
);

const ScheduledPaymentV2 = lazy(() => 
  import('../pages/ScheduledPaymentV2')
);

const SuppliersPage = lazy(() => 
  import('../pages/SuppliersPage')
);

const DataAnalyticsV3 = lazy(() => 
  import('../pages/DataAnalyticsV3')
);

const AgentMarket = lazy(() => 
  import('../pages/AgentMarket')
);

const AgentDetails = lazy(() => 
  import('../pages/AgentDetails')
);

/**
 * 懒加载路由组件
 */
export const LazyRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 流支付可视化 */}
        <Route path="/" element={<FlowPaymentVisualization />} />
        <Route path="/flow-payment" element={<FlowPaymentVisualization />} />
        
        {/* 流支付（质押） */}
        <Route path="/flow-payment-stake" element={<FlowPaymentStakePage />} />
        
        {/* 批量支付 */}
        <Route path="/batch-payment" element={<BatchPayment />} />
        
        {/* 定时支付 */}
        <Route path="/scheduled-payment" element={<ScheduledPaymentV2 />} />
        
        {/* 供应商管理 */}
        <Route path="/suppliers" element={<SuppliersPage />} />
        
        {/* 数据分析 */}
        <Route path="/analytics" element={<DataAnalyticsV3 />} />
        
        {/* Agent 市场 */}
        <Route path="/agent-market" element={<AgentMarket />} />
        <Route path="/agent/:agentId" element={<AgentDetails />} />
      </Routes>
    </Suspense>
  );
};

export default LazyRoutes;

