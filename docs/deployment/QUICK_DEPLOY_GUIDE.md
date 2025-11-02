# 快速部署指南 / Quick Deploy Guide

## 🚀 一分钟完成部署

### 方法 1: Vercel 仪表板（最简单）

1. **登录 Vercel**
   ```
   访问: https://vercel.com/login
   ```

2. **进入项目**
   ```
   访问: https://vercel.com/everest-ans-projects/protocol-bank
   ```

3. **触发部署**
   - 点击 "Deployments" 标签
   - 点击 "Redeploy" 按钮
   - 等待 2-5 分钟

4. **完成！**
   ```
   访问: https://protocolbanks.com
   ```

---

### 方法 2: Vercel CLI

```bash
# 1. 安装 CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
cd Protocol-Bank
vercel --prod
```

---

## ⚙️ 环境变量（如果还没配置）

在 Vercel 项目设置中添加：

```
VITE_ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_STAKED_ESCROW_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04
VITE_STREAM_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_MOCK_USDC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**如何添加**:
1. 进入 Settings → Environment Variables
2. 点击 "Add New"
3. 粘贴变量名和值
4. 选择 "Production"
5. 点击 "Save"

---

## ✅ 部署后验证

访问 https://protocolbanks.com 并检查：

- [ ] 页面正常加载
- [ ] 语言切换工作（右上角）
- [ ] 主题切换工作（右上角）
- [ ] 点击 "Connect Wallet" 可以连接 MetaMask
- [ ] Flow Payment 页面正常显示

---

## 📞 需要帮助？

- **完整文档**: 查看 `FINAL_REPORT.md`
- **部署问题**: 查看 `DEPLOYMENT.md`
- **技术支持**: https://help.manus.im

---

**就这么简单！** 🎉

