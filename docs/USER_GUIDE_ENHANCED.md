# Protocol Bank 用户使用指南 (增强版)

**版本**: 1.1  
**更新日期**: 2025-11-14  
**作者**: Manus AI

---

## 🚀 欢迎使用 Protocol Bank

Protocol Bank 是一款功能强大的去中心化支付管理平台,旨在帮助您轻松管理加密货币支付、自动化财务流程并节省 Gas 费用。本指南将引导您快速上手 Protocol Bank 的各项核心功能。

### 目录

1. [钱包连接](#1-钱包连接)
2. [Stream Payment (流式支付)](#2-stream-payment-流式支付)
3. [Batch Payment (批量支付)](#3-batch-payment-批量支付)
4. [Analytics (财务分析)](#4-analytics-财务分析)
5. [Automation (自动化)](#5-automation-自动化)
6. [常见问题 (FAQ)](#6-常见问题-faq)

---

## 1. 钱包连接

### 1.1 连接您的钱包

1. **点击 "Connect Wallet"**
   - 在页面右上角找到 "Connect Wallet" 按钮并点击。

2. **选择钱包**
   - 目前支持 MetaMask,未来将支持 WalletConnect 和 Coinbase Wallet。
   - 在弹出的 MetaMask 窗口中,选择您要连接的账户。

3. **确认连接**
   - 点击 "连接" 按钮,完成授权。
   - 连接成功后,您的钱包地址将显示在右上角。

### 1.2 支持的网络

| 网络名称 | Chain ID | 类型 | 状态 |
|:---|:---:|:---:|:---|
| Sepolia | 11155111 | 测试网 | ✅ 支持 |
| Base Sepolia | 84532 | 测试网 | ✅ 支持 |
| Base Mainnet | 8453 | 主网 | 计划中 |

---

## 2. Stream Payment (流式支付)

流式支付允许您按秒向收款人持续支付资金,非常适合发放工资、订阅费和承包商费用。

### 2.1 创建单个支付流

1. **进入 Stream Payment 页面**
   - 在左侧导航栏点击 "Payments"。

2. **点击 "Create Stream"**
   - 在页面右上角找到 "Create Stream" 按钮并点击。

3. **填写表单**
   - **Stream Name**: 为您的支付流命名 (例如: "Monthly Salary for Alice")。
   - **Recipient Address**: 输入收款人的以太坊地址。
   - **Token**: 选择要支付的代币 (ETH, USDC, DAI, USDT)。
   - **Amount**: 输入总支付金额。
   - **Start Time**: 选择支付开始时间。
   - **End Time**: 选择支付结束时间。
   - **Category**: 选择支付类别。

4. **确认并创建**
   - 检查 Gas 费用估算。
   - 点击 "Create Stream" 按钮。
   - 在 MetaMask 中确认交易。

### 2.2 管理支付流

在 Stream Payment 页面的列表中,您可以对每个支付流进行管理:

- **暂停 (Pause)**: 暂时停止支付流。
- **恢复 (Resume)**: 恢复已暂停的支付流。
- **停止 (Stop)**: 永久停止支付流,剩余资金将退还给您。
- **取消 (Cancel)**: 取消支付流,已支付和未支付的资金将按比例分配。

---

## 3. Batch Payment (批量支付)

批量支付功能允许您通过单次交易向多个地址发送付款,并利用 X402 协议大幅节省 Gas 费用。

### 3.1 手动添加支付

1. **进入 Batch Payment 页面**
   - 在 "Payments" 页面点击 "Batch" 标签。

2. **添加支付项**
   - 点击 "Add Payment" 按钮。
   - 填写收款人地址、金额和类别。
   - 重复此步骤添加所有支付项。

### 3.2 使用 CSV 导入

1. **下载模板**
   - 点击 "Download Template" 下载 CSV 模板。

2. **填写 CSV 文件**
   - 按照模板格式填写收款人地址、金额、类别和描述。

3. **导入 CSV**
   - 点击 "Import CSV" 并选择您编辑好的文件。
   - 系统将自动解析并填充支付列表。

### 3.3 执行批量支付

1. **开启 X402**
   - 确保 "X402 Batch Settlement" 开关已打开,以节省 Gas 费用。

2. **检查 Gas 费用**
   - 在 "Gas Fee Comparison" 卡片中查看单笔交易与批量交易的费用对比。

3. **执行支付**
   - 点击 "Execute Batch Payment" 按钮。
   - 在 MetaMask 中确认交易。

4. **查看结果**
   - 交易完成后,您可以在 "Transaction Results" 部分查看成功和失败的交易详情。

---

## 4. Analytics (财务分析)

Analytics 页面为您提供全面的财务分析,帮助您了解资金流动情况。

### 4.1 查看财务报表

1. **进入 Analytics 页面**
   - 在左侧导航栏点击 "Analytics"。

2. **切换数据源**
   - **Demo Data**: 查看演示数据,了解功能。
   - **Blockchain Data**: 连接钱包后,查看您在区块链上的真实交易数据。

### 4.2 使用分析工具

- **日期范围筛选**: 选择要分析的时间范围 (30天, 90天, 1年等)。
- **周期切换**: 按月度或年度查看数据。
- **图表分析**: 查看现金流趋势、收支对比和分类饼图。
- **CSV 导出**: 点击 "Export CSV" 导出分析数据。

---

## 5. Automation (自动化)

Automation 页面允许您创建自动化的支付流程,无需手动干预。

### 5.1 创建定时支付

1. **进入 Automation 页面**
   - 在左侧导航栏点击 "Automation"。

2. **使用 Flow Builder**
   - 在 "Flow Builder" 视图中,通过拖拽节点来创建您的自动化流程。
   - **Trigger (触发器)**: 设置流程的触发条件 (例如: 每月1号, 每周一)。
   - **Action (操作)**: 设置要执行的操作 (例如: 发送支付, 调用 API)。
   - **Condition (条件)**: 设置条件判断 (例如: 如果余额 > 1000)。

3. **部署流程**
   - 点击 "Deploy Flow" 部署您的自动化流程。
   - 您可以在 "Deployed Flows" 列表中查看和管理所有已部署的流程。

---

## 6. 常见问题 (FAQ)

### Q1: 什么是 X402 协议? 为什么能节省 Gas 费?

**A1**: X402 是一种开放支付协议,它允许将多个支付授权打包到单次交易中进行结算。通过这种方式,可以避免为每笔支付都发送一笔交易,从而大幅节省 Gas 费用,最高可达 70%。

### Q2: 我的资金安全吗?

**A2**: 是的。Protocol Bank 是一个非托管平台,您的资金始终由您自己的钱包控制。所有交易都需要您在 MetaMask 中手动确认。智能合约代码也经过了严格测试。

### Q3: 我可以在哪些网络上使用 Protocol Bank?

**A3**: 目前支持 Sepolia 和 Base Sepolia 测试网。我们计划在未来支持 Base 主网和其他主流网络。

### Q4: 如果批量支付中有部分交易失败怎么办?

**A4**: 失败的交易不会影响其他成功的交易。您可以在 "Transaction Results" 中查看失败的原因,并在修正后重新提交失败的交易。

### Q5: 我可以导出我的交易数据吗?

**A5**: 是的。在 Analytics 页面,您可以随时将您的交易数据导出为 CSV 文件,以便在其他软件(如 Excel)中进行分析。

---

**需要更多帮助?**

如果您有任何问题或建议,请随时通过以下方式联系我们:

- **Email**: support@protocolbank.com
- **Discord**: [discord.gg/protocolbank](https://discord.gg/protocolbank)
- **GitHub**: [github.com/everest-an/Protocol-Bank](https://github.com/everest-an/Protocol-Bank)
