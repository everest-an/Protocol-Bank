# 部署文档 / Deployment Guide

## 目录 / Table of Contents

1. [前置要求](#前置要求--prerequisites)
2. [环境变量配置](#环境变量配置--environment-variables)
3. [本地开发](#本地开发--local-development)
4. [构建生产版本](#构建生产版本--build-for-production)
5. [部署到 Vercel](#部署到-vercel--deploy-to-vercel)
6. [部署后验证](#部署后验证--post-deployment-verification)
7. [故障排查](#故障排查--troubleshooting)

---

## 前置要求 / Prerequisites

### 必需软件 / Required Software

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Git**: 最新版本

### 必需账户 / Required Accounts

1. **GitHub Account** - 代码托管
2. **Vercel Account** - 前端部署
3. **Alchemy Account** - Ethereum RPC 服务
4. **MetaMask Wallet** - 测试和使用

---

## 环境变量配置 / Environment Variables

### 1. 创建 `.env` 文件

在项目根目录创建 `.env` 文件：

```bash
# Alchemy RPC Configuration
VITE_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Sepolia Network Configuration
VITE_SEPOLIA_CHAIN_ID=11155111

# Smart Contract Addresses
VITE_STAKED_ESCROW_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04
VITE_STREAM_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_MOCK_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 2. 获取 Alchemy API Key

1. 访问 https://www.alchemy.com/
2. 创建账户并登录
3. 创建新的 App（选择 Sepolia 网络）
4. 复制 API Key
5. 替换 `.env` 中的 `YOUR_API_KEY`

### 3. 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_ALCHEMY_RPC_URL` | Alchemy RPC 端点 | `https://eth-sepolia.g.alchemy.com/v2/...` |
| `VITE_SEPOLIA_CHAIN_ID` | Sepolia 链 ID | `11155111` |
| `VITE_STAKED_ESCROW_ADDRESS` | StakedPaymentEscrow 合约地址 | `0x44a55...` |
| `VITE_STREAM_PAYMENT_ADDRESS` | StreamPayment 合约地址 | `0x5FbDB...` |
| `VITE_MOCK_USDC_ADDRESS` | Mock USDC 合约地址 | `0xe7f17...` |

---

## 本地开发 / Local Development

### 1. 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 2. 启动开发服务器

```bash
# 启动开发服务器
pnpm run dev

# 服务器将在 http://localhost:5173 启动
```

### 3. 开发模式特性

- ✅ 热模块替换（HMR）
- ✅ 快速刷新
- ✅ 错误提示
- ✅ TypeScript 类型检查

---

## 构建生产版本 / Build for Production

### 1. 构建命令

```bash
# 构建生产版本
pnpm run build

# 输出目录: dist/
```

### 2. 预览构建结果

```bash
# 预览生产构建
pnpm run preview

# 预览服务器将在 http://localhost:4173 启动
```

### 3. 构建优化

构建过程会自动进行以下优化：
- ✅ 代码压缩
- ✅ Tree shaking
- ✅ 资源优化
- ✅ 代码分割
- ✅ 缓存优化

---

## 部署到 Vercel / Deploy to Vercel

### 方法 1: 使用 Vercel CLI（推荐）

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署

```bash
# 首次部署
vercel

# 生产部署
vercel --prod
```

### 方法 2: 使用 GitHub 集成

#### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "feat: 准备部署"
git push origin main
```

#### 2. 连接 Vercel

1. 访问 https://vercel.com/
2. 点击 "Add New Project"
3. 导入 GitHub 仓库
4. 选择 `everest-an/Protocol-Bank`

#### 3. 配置项目

**Framework Preset**: Vite
**Build Command**: `pnpm run build`
**Output Directory**: `dist`
**Install Command**: `pnpm install`

#### 4. 配置环境变量

在 Vercel 项目设置中添加环境变量：

```
VITE_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_STAKED_ESCROW_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04
VITE_STREAM_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_MOCK_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

#### 5. 部署

点击 "Deploy" 按钮开始部署。

### 方法 3: 使用 Vercel API

```bash
# 使用提供的 Vercel Token
export VERCEL_TOKEN=o6ZTKMbam099zpwWNe9umquY

# 部署
vercel --token $VERCEL_TOKEN --prod
```

---

## 部署后验证 / Post-Deployment Verification

### 1. 检查部署状态

访问 Vercel 仪表板查看部署状态：
- ✅ 构建成功
- ✅ 部署完成
- ✅ 域名已分配

### 2. 功能测试清单

#### 基础功能
- [ ] 页面正常加载
- [ ] 多语言切换工作
- [ ] 主题切换工作
- [ ] 响应式布局正常

#### 钱包连接
- [ ] MetaMask 连接成功
- [ ] 账户地址显示正确
- [ ] 网络切换到 Sepolia 成功

#### 智能合约交互
- [ ] 读取合约数据成功
- [ ] 发送交易成功
- [ ] 交易确认正常
- [ ] 错误处理正确

#### 核心功能
- [ ] Flow Payment 可视化正常
- [ ] 质押池创建成功
- [ ] 白名单管理正常
- [ ] 支付执行成功
- [ ] 批量支付工作
- [ ] 定时支付工作

### 3. 性能检查

使用 Lighthouse 检查性能：
- **Performance**: > 90
- **Accessibility**: > 90
- **Best Practices**: > 90
- **SEO**: > 90

---

## 故障排查 / Troubleshooting

### 问题 1: 构建失败

**症状**: `pnpm run build` 失败

**解决方案**:
```bash
# 清理缓存
rm -rf node_modules dist .vite
pnpm install
pnpm run build
```

### 问题 2: 环境变量未生效

**症状**: 应用无法连接到 Alchemy

**解决方案**:
1. 确认 Vercel 环境变量已正确配置
2. 重新部署项目
3. 检查变量名是否以 `VITE_` 开头

### 问题 3: 钱包连接失败

**症状**: 无法连接 MetaMask

**解决方案**:
1. 确认 MetaMask 已安装
2. 检查网络是否为 Sepolia
3. 刷新页面重试
4. 检查浏览器控制台错误

### 问题 4: 合约调用失败

**症状**: 交易失败或合约读取失败

**解决方案**:
1. 确认合约地址正确
2. 检查 Alchemy RPC URL 是否有效
3. 确认账户有足够的 ETH（Gas 费）
4. 查看 Sepolia Etherscan 上的交易详情

### 问题 5: 页面 404 错误

**症状**: 刷新页面后显示 404

**解决方案**:
- 确认 `vercel.json` 中的 rewrites 配置正确
- 重新部署项目

---

## 域名配置 / Domain Configuration

### 1. 添加自定义域名

1. 在 Vercel 项目设置中选择 "Domains"
2. 添加域名 `protocolbanks.com`
3. 按照提示配置 DNS 记录

### 2. DNS 配置

在域名注册商处添加以下记录：

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL 证书

Vercel 会自动配置 SSL 证书（Let's Encrypt）。

---

## 持续集成 / Continuous Integration

### GitHub Actions 配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 监控和日志 / Monitoring and Logging

### 1. Vercel Analytics

启用 Vercel Analytics 查看：
- 页面访问量
- 性能指标
- 错误率

### 2. 错误追踪

使用 Sentry 或类似服务追踪生产错误：

```bash
pnpm add @sentry/react
```

### 3. 日志查看

在 Vercel 仪表板查看：
- 构建日志
- 运行时日志
- 函数日志

---

## 回滚 / Rollback

### 快速回滚到上一个版本

1. 访问 Vercel 仪表板
2. 选择 "Deployments"
3. 找到上一个成功的部署
4. 点击 "Promote to Production"

---

## 联系支持 / Contact Support

如有问题，请访问：
- **Vercel Support**: https://vercel.com/support
- **Protocol Bank**: https://help.manus.im

---

**最后更新**: 2025-10-28
**版本**: 1.0.0

