# Protocol Bank 用户使用指南

## 📖 目录

1. [快速开始](#快速开始)
2. [功能模块](#功能模块)
3. [Stream Payment 流式支付](#stream-payment-流式支付)
4. [Batch Payment 批量支付](#batch-payment-批量支付)
5. [Scheduled Payment 定时支付](#scheduled-payment-定时支付)
6. [Financial Analytics 财务分析](#financial-analytics-财务分析)
7. [Supplier Management 供应商管理](#supplier-management-供应商管理)
8. [X402 开放支付协议](#x402-开放支付协议)
9. [常见问题](#常见问题)

---

## 快速开始

### 1. 连接钱包

1. 点击右上角 "Connect Wallet" 按钮
2. 选择您的钱包(MetaMask, WalletConnect等)
3. 授权连接
4. 确保连接到正确的网络:
   - **Sepolia测试网** - 用于Stream Payment
   - **Base Sepolia测试网** - 用于X402支付

### 2. 获取测试代币

**Sepolia测试网:**
- ETH Faucet: https://sepoliafaucet.com/
- Mock USDC: `0xf6d01Aca4eC4DDde69c9f8119B607E10AD248cC7`
- Mock DAI: `0x399F5902226705B23Ce22F10a8E676A2B1f782d0`

**Base Sepolia测试网:**
- ETH Faucet: https://www.alchemy.com/faucets/base-sepolia

---

## 功能模块

Protocol Bank提供6大核心功能模块:

| 模块 | 功能 | 使用场景 |
|:---|:---|:---|
| **Stream Payment** | 流式支付 | 按时间流式支付,如工资、订阅 |
| **Batch Payment** | 批量支付 | 一次性支付多个收款人 |
| **Scheduled Payment** | 定时支付 | 定时自动执行支付 |
| **Financial Analytics** | 财务分析 | 可视化分析支付数据 |
| **Supplier Management** | 供应商管理 | 管理供应商信息和支付历史 |
| **Automation** | 自动化工作流 | 创建自动化支付规则 |

---

## Stream Payment 流式支付

### 什么是流式支付?

流式支付允许您按时间流式支付资金,而不是一次性支付。例如:
- 按秒支付工资
- 按分钟支付订阅费用
- 按小时支付服务费

### 创建单个流式支付

1. 进入 "Stream Payment" 页面
2. 点击 "Create Stream" 按钮
3. 填写表单:
   - **Stream Name**: 支付流名称
   - **Recipient**: 收款人地址
   - **Token**: 选择代币(ETH/USDC/DAI/USDT)
   - **Amount**: 总金额
   - **Category**: 支付类别
   - **Start Time**: 开始时间
   - **End Time**: 结束时间
4. 查看Gas费用预估和流速率
5. 点击 "Create Stream"
6. 在钱包中确认交易

### 批量创建流式支付

1. 点击 "Batch Create" 按钮
2. 下载CSV模板
3. 填写CSV文件:
   ```csv
   recipient,token,amount,startTime,endTime,category
   0x123...,USDC,1000,2024-01-01T00:00:00,2024-12-31T23:59:59,AI Services
   0x456...,DAI,500,2024-01-01T00:00:00,2024-06-30T23:59:59,Marketing
   ```
4. 上传CSV文件
5. 预览数据并检查错误
6. 点击 "Create All Streams"
7. 等待批量创建完成

### 管理流式支付

**暂停支付流:**
1. 在交易列表中找到支付流
2. 点击 "Pause" 按钮
3. 确认交易

**恢复支付流:**
1. 找到已暂停的支付流
2. 点击 "Resume" 按钮
3. 确认交易

**停止支付流:**
1. 找到支付流
2. 点击 "Stop" 按钮
3. 确认停止(不可恢复)

**取消支付流:**
1. 找到支付流
2. 点击 "Cancel" 按钮
3. 确认取消并退款

### 筛选和搜索

**搜索:**
- 在搜索框输入名称或地址

**日期筛选:**
- 选择开始日期和结束日期

**状态筛选:**
- All: 所有状态
- Active: 进行中
- Paused: 已暂停
- Completed: 已完成
- Cancelled: 已取消

**类别筛选:**
- AI Services
- Marketing
- Logistics
- Raw Materials
- Software
- Consulting
- Security Services
- Other

### 支付网络关系图

**查看网络图:**
- 中心节点: 您的账户
- 绿色节点: 供应商(支付成功)
- 红色节点: 供应商(支付失败)
- 灰色节点: 供应商(支付停止)
- 橙色粒子: 交易流动

**交互功能:**
- **拖动节点**: 点击并拖动节点重新布局
- **点击节点**: 查看节点详细信息
- **缩放**: 鼠标滚轮缩放,或使用缩放按钮
- **平移**: 拖动空白区域移动视图

---

## Batch Payment 批量支付

### 创建批量支付

1. 进入 "Batch Payment" 页面
2. 选择支付方式:
   - **传统方式**: 逐个发送交易
   - **X402方式**: 使用X402批量结算(低Gas费)
3. 添加收款人:
   - 手动添加
   - 或上传CSV文件
4. 查看Gas费用对比
5. 点击 "Send Batch Payment"
6. 确认交易

### Gas费用对比

| 方式 | Gas费用 | 速度 | 适用场景 |
|:---|:---|:---|:---|
| 传统方式 | 高 | 快 | 少量支付 |
| X402方式 | 极低 | 中 | 大量微交易 |

---

## Scheduled Payment 定时支付

### 创建定时支付

1. 进入 "Scheduled Payment" 页面
2. 点击 "Create Schedule" 按钮
3. 填写表单:
   - **Name**: 定时任务名称
   - **Recipient**: 收款人地址
   - **Token**: 代币类型
   - **Amount**: 金额
   - **Schedule Type**: 
     - One-time: 一次性
     - Recurring: 重复执行
   - **Frequency**: (重复时)
     - Daily: 每天
     - Weekly: 每周
     - Monthly: 每月
     - Custom: 自定义Cron表达式
   - **Start Time**: 开始时间
   - **End Time**: (可选)结束时间
4. 点击 "Create Schedule"

### Cron表达式示例

```
0 0 9 * * 1-5    # 工作日早上9点
0 0 0 1 * *      # 每月1号午夜
0 */2 * * * *    # 每2小时
```

### 管理定时任务

- **暂停**: 暂停任务执行
- **恢复**: 恢复任务执行
- **删除**: 删除任务

### 查看执行历史

在任务详情中可以查看:
- 执行时间
- 执行状态
- 交易哈希
- 错误信息(如果失败)

---

## Financial Analytics 财务分析

### 统计卡片

查看关键指标:
- **Total Payments**: 总支付额
- **Active Streams**: 活跃支付流数量
- **Total Suppliers**: 供应商数量
- **Avg Payment**: 平均支付金额

### 支付趋势图

- 查看过去30天的支付趋势
- 按日期分组
- 显示总金额和笔数

### 分类分布图

- 饼图显示各类别支付占比
- 点击图例筛选类别

### 供应商排名

- Top 10供应商
- 按支付总额排序
- 显示支付笔数

### 月度统计

- 按月份统计支付数据
- 对比不同月份

### 导出报表

1. 设置筛选条件
2. 点击 "Export CSV" 按钮
3. 下载CSV文件

---

## Supplier Management 供应商管理

### 添加供应商

1. 进入 "Suppliers" 页面
2. 点击 "Add Supplier" 按钮
3. 填写信息:
   - Name: 供应商名称
   - Address: 钱包地址
   - Email: 邮箱
   - Category: 类别
   - Tags: 标签
4. 点击 "Add"

### 编辑供应商

1. 找到供应商
2. 点击 "Edit" 按钮
3. 修改信息
4. 点击 "Save"

### 删除供应商

1. 找到供应商
2. 点击 "Delete" 按钮
3. 确认删除

### 查看支付历史

1. 点击供应商卡片
2. 查看详细信息:
   - 总支付额
   - 支付笔数
   - 支付历史列表

### 批量导入供应商

1. 点击 "Import CSV" 按钮
2. 下载模板
3. 填写CSV文件
4. 上传文件
5. 预览并确认

### 导出供应商列表

1. 点击 "Export CSV" 按钮
2. 下载CSV文件

---

## X402 开放支付协议

### 什么是X402?

X402是一种基于HTTP 402状态码的开放支付协议,支持:
- **即用即付**: 无需预充值
- **微交易**: 支持$0.0001级别的支付
- **低Gas费**: 批量结算,显著降低成本
- **"免Gas费"**: 用户只需签名,Gas由中继者承担

### 工作流程

```
1. 用户请求API
   ↓
2. 服务器返回402 (需要支付)
   ↓
3. 用户钱包签名授权 (链下,免费)
   ↓
4. 服务器验证签名 (链下,免费)
   ↓
5. 中继者批量提交到Base L2 (链上,低成本)
   ↓
6. 资金实际转移完成
```

### 使用X402支付

1. 在批量支付页面选择 "X402 Mode"
2. 添加收款人和金额
3. 点击 "Send with X402"
4. 在钱包中签名授权(不需要支付Gas)
5. 等待批量结算完成

### 成本对比

**传统方案 (ETH主网):**
- 单笔转账: ~$10 Gas费
- 100笔微交易: $1,000 Gas费

**X402 + Base L2方案:**
- 单笔授权: $0 (链下签名)
- 批量结算100笔: ~$0.10 Gas费
- 平均每笔: **$0.001**

---

## 常见问题

### Q: 如何获取测试代币?

A: 访问以下faucet:
- Sepolia ETH: https://sepoliafaucet.com/
- Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia

### Q: 为什么交易失败?

A: 常见原因:
1. 余额不足
2. Gas价格太低
3. 未授权代币
4. 网络拥堵

### Q: 如何查看交易详情?

A: 点击TX Hash链接,跳转到区块链浏览器:
- Sepolia: https://sepolia.etherscan.io/
- Base Sepolia: https://sepolia.basescan.org/

### Q: 流式支付可以提前停止吗?

A: 可以,使用 "Stop" 或 "Cancel" 功能。
- Stop: 停止支付,已支付部分不退款
- Cancel: 取消支付,未支付部分退款

### Q: X402支付安全吗?

A: 是的,X402使用EIP-3009标准,具有:
- 签名验证
- Nonce防重放攻击
- 链上审计
- 去中心化

### Q: 如何导出财务报表?

A: 在Analytics页面点击 "Export CSV" 按钮,下载完整的财务数据。

### Q: 支持哪些代币?

A: 当前支持:
- ETH
- USDC
- DAI
- USDT

### Q: 如何联系支持?

A: 
- GitHub Issues: https://github.com/everest-an/Protocol-Bank/issues
- Email: support@protocolbank.io

---

## 🎉 开始使用

现在您已经了解了Protocol Bank的所有功能,开始体验吧!

1. 连接钱包
2. 获取测试代币
3. 创建第一个流式支付
4. 探索其他功能

祝您使用愉快!🚀
