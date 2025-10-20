# 实时数据推送功能文档

## 🚀 功能概述

Stream Payment 现在支持**实时数据推送**,无需手动刷新页面即可获取最新的链上数据。

---

## ✨ 核心特性

### 1. 智能合约事件监听
- ✅ **SupplierRegistered** - 新供应商注册时实时通知
- ✅ **PaymentCreated** - 新支付创建时实时通知
- ✅ **PaymentStatusUpdated** - 支付状态更新时实时通知

### 2. 实时通知系统
- ✅ **弹窗通知** - 右上角显示实时事件通知
- ✅ **自动消失** - 5秒后自动关闭
- ✅ **手动关闭** - 可点击 X 按钮立即关闭
- ✅ **详细信息** - 显示事件类型、数据和时间戳

### 3. 实时状态指示器
- ✅ **Live 指示器** - 显示当前是否正在监听事件
- ✅ **动画效果** - 绿色脉冲动画表示实时连接
- ✅ **状态切换** - 自动检测连接状态

### 4. 自动数据刷新
- ✅ **事件触发刷新** - 收到事件后自动重新加载数据
- ✅ **无需手动操作** - 数据始终保持最新
- ✅ **性能优化** - 智能防抖,避免频繁请求

---

## 🎯 使用场景

### 场景 1: 多用户协作
当多个用户同时使用系统时,任何一个用户的操作都会实时反映到所有用户的界面上。

**示例**:
1. 用户 A 注册了一个新供应商
2. 用户 B 的界面立即显示通知:"New Supplier Registered"
3. 用户 B 的供应商列表自动更新

### 场景 2: 支付监控
实时监控所有支付活动,无需刷新页面。

**示例**:
1. 用户 A 创建了一笔支付
2. 所有在线用户立即收到通知:"New Payment Created"
3. 可视化图表自动更新,显示新的资金流向

### 场景 3: 状态追踪
实时追踪支付状态变化。

**示例**:
1. 支付状态从 Pending 变为 Completed
2. 立即收到通知:"Payment Status Updated"
3. 支付表格自动更新状态

---

## 🔧 技术实现

### 架构设计

```
┌─────────────────────────────────────────┐
│         Smart Contract (Sepolia)        │
│  ┌────────────────────────────────────┐ │
│  │  Events:                           │ │
│  │  - SupplierRegistered              │ │
│  │  - PaymentCreated                  │ │
│  │  - PaymentStatusUpdated            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  ethers.js Provider  │
        │  Event Listener      │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  useContractEvents   │
        │  Hook                │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  React Components    │
        │  - Notifications     │
        │  - Live Indicator    │
        │  - Auto Refresh      │
        └──────────────────────┘
```

### 核心组件

#### 1. useContractEvents Hook
```javascript
// 监听智能合约事件
const { isListening } = useContractEvents(contract, (event) => {
  console.log('Event received:', event);
  // 处理事件
});
```

**功能**:
- 自动订阅合约事件
- 解析事件数据
- 触发回调函数
- 自动清理监听器

#### 2. useRealtimeNotifications Hook
```javascript
// 管理实时通知
const { notifications, addNotification, removeNotification } = useRealtimeNotifications();
```

**功能**:
- 添加新通知
- 自动移除过期通知
- 手动关闭通知
- 通知队列管理

#### 3. RealtimeNotifications Component
```jsx
<RealtimeNotifications
  notifications={notifications}
  onRemove={removeNotification}
/>
```

**功能**:
- 显示通知列表
- 动画效果
- 交互操作

#### 4. LiveIndicator Component
```jsx
<LiveIndicator isLive={isListening} />
```

**功能**:
- 显示连接状态
- 脉冲动画
- 状态文字

---

## 📊 事件数据格式

### SupplierRegistered
```javascript
{
  type: 'SupplierRegistered',
  data: {
    wallet: '0x...',
    name: 'Supplier Name',
    brand: 'Brand Name',
    category: 'Technology'
  }
}
```

### PaymentCreated
```javascript
{
  type: 'PaymentCreated',
  data: {
    id: 1,
    from: '0x...',
    to: '0x...',
    amount: '0.1',  // in ETH
    category: 'Technology',
    timestamp: 1234567890
  }
}
```

### PaymentStatusUpdated
```javascript
{
  type: 'PaymentStatusUpdated',
  data: {
    id: 1,
    status: 'Completed'  // 'Pending' | 'Completed' | 'Failed'
  }
}
```

---

## 🎨 UI/UX 设计

### 通知样式
- **位置**: 右上角固定
- **动画**: 从右侧滑入
- **颜色**: 
  - 成功: 绿色图标
  - 错误: 红色图标
  - 信息: 蓝色图标
- **持续时间**: 5秒自动消失
- **最大数量**: 无限制,自动堆叠

### Live 指示器
- **位置**: 顶部工具栏
- **状态**:
  - Live: 绿色圆点 + 脉冲动画 + "Live" 文字
  - Offline: 灰色圆点 + "Offline" 文字
- **图标**: Activity 图标

---

## 🔍 调试和监控

### 控制台日志
所有事件都会在浏览器控制台输出:

```
🎉 New supplier registered: { wallet: '0x...', name: '...', ... }
💸 New payment created: { id: 1, from: '0x...', ... }
🔄 Payment status updated: { id: 1, status: 'Completed' }
```

### 事件监听状态
检查 `isListening` 状态:
```javascript
console.log('Is listening:', isListening);  // true/false
```

---

## ⚡ 性能优化

### 1. 事件防抖
避免短时间内多次刷新数据:
```javascript
// 使用 useCallback 优化
const handleContractEvent = useCallback((event) => {
  // 处理事件
}, [dependencies]);
```

### 2. 自动清理
组件卸载时自动移除事件监听器:
```javascript
useEffect(() => {
  // 订阅事件
  return () => {
    // 清理监听器
  };
}, [contract]);
```

### 3. 条件监听
只在连接到正确网络时监听:
```javascript
if (isConnected && isSepolia) {
  // 开始监听
}
```

---

## 🐛 故障排除

### 问题 1: 没有收到实时通知
**可能原因**:
- 未连接钱包
- 不在 Sepolia 网络
- 合约实例未初始化

**解决方案**:
1. 检查钱包连接状态
2. 确认网络为 Sepolia
3. 查看控制台错误日志

### 问题 2: Live 指示器显示 Offline
**可能原因**:
- Provider 未初始化
- 合约地址错误
- 网络连接问题

**解决方案**:
1. 刷新页面重新连接
2. 检查合约地址配置
3. 检查网络连接

### 问题 3: 通知不自动消失
**可能原因**:
- JavaScript 定时器被阻塞
- 浏览器标签页未激活

**解决方案**:
1. 手动点击 X 关闭
2. 激活浏览器标签页

---

## 🚀 未来优化

### 计划功能
1. ✨ **WebSocket 支持** - 更低延迟的实时推送
2. ✨ **通知声音** - 可选的声音提醒
3. ✨ **通知历史** - 查看所有历史通知
4. ✨ **过滤器** - 选择性接收特定类型的通知
5. ✨ **桌面通知** - 浏览器原生通知 API
6. ✨ **移动端优化** - 触摸友好的通知界面

### 性能提升
1. 🔧 **事件缓存** - 避免重复处理相同事件
2. 🔧 **批量更新** - 合并多个事件的数据更新
3. 🔧 **懒加载** - 按需加载历史事件

---

## 📝 示例代码

### 完整使用示例
```jsx
import { useContractEvents, useRealtimeNotifications } from '../hooks/useContractEvents';
import RealtimeNotifications from '../components/RealtimeNotifications';
import LiveIndicator from '../components/LiveIndicator';

function MyComponent() {
  const { contract } = useStreamContract(signer, provider);
  const { notifications, addNotification, removeNotification } = useRealtimeNotifications();
  
  const handleEvent = useCallback((event) => {
    addNotification({
      type: 'success',
      eventType: event.type,
      data: event.data,
    });
    // 自动刷新数据
    loadData();
  }, []);
  
  const { isListening } = useContractEvents(contract, handleEvent);
  
  return (
    <div>
      <LiveIndicator isLive={isListening} />
      <RealtimeNotifications
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}
```

---

## 📚 相关文档

- [ethers.js Events](https://docs.ethers.org/v6/api/contract/#ContractEvent)
- [React Hooks](https://react.dev/reference/react)
- [Web3 Best Practices](https://ethereum.org/en/developers/docs/apis/javascript/)

---

**版本**: 1.0.0  
**更新日期**: 2025-10-20  
**状态**: ✅ 已实现并测试

