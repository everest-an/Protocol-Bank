# Protocol Bank Admin Dashboard

企業級區塊鏈銀行管理後台，集成AI驅動的異常交易檢測功能。

## ✨ 核心功能

### 📊 儀表板統計
- 實時交易數據概覽
- 待處理交易監控
- 已標記交易預警
- 活躍帳戶統計
- 需要審核的高風險交易列表

### 💳 交易管理
- **完整的交易生命週期管理**
  - 分頁、篩選、搜索功能
  - 按狀態、類型、時間範圍篩選
  - 實時風險分數顯示
  - 區塊鏈瀏覽器鏈接

- **🤖 AI驅動的異常交易檢測**
  - 深度學習模型分析交易模式
  - 多維度異常指標識別
  - 智能風險評估和建議
  - 詳細的AI推理說明
  - 高置信度決策支持

- **審核工作流**
  - 一鍵批准/標記/拒絕交易
  - 自動記錄審計日誌
  - 支持批量操作

### 👥 帳戶管理
- 用戶帳戶列表和詳情
- KYC狀態追蹤
- 風險等級評估
- 帳戶餘額監控
- 交易歷史查詢

### 📈 數據分析
- 交易趨勢可視化
- 客戶行為分析
- 風險分布統計
- 自定義報告生成

### 📝 審計日誌
- 完整的操作記錄
- 管理員行為追蹤
- 系統事件日誌
- 合規性報告

## 🛠️ 技術棧

### 前端
- **React 19** - 最新的React版本
- **TypeScript** - 類型安全
- **Tailwind CSS 4** - 現代化樣式
- **shadcn/ui** - 高質量UI組件庫
- **tRPC** - 端到端類型安全的API
- **Wouter** - 輕量級路由
- **Recharts** - 數據可視化

### 後端
- **Express 4** - Web框架
- **tRPC 11** - API層
- **Drizzle ORM** - 類型安全的ORM
- **MySQL/TiDB** - 數據庫
- **JWT** - 身份驗證

### AI功能
- **LLM集成** - 大語言模型驅動的分析
- **異常檢測算法** - 多維度風險評估
- **模式識別** - 交易行為分析

## 🚀 快速開始

### 前置要求
- Node.js 22+
- pnpm 9+
- MySQL 8+ 或 TiDB

### 安裝

```bash
# 克隆倉庫
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank/admin-dashboard

# 安裝依賴
pnpm install

# 配置環境變量
cp .env.example .env
# 編輯 .env 文件，填入您的配置

# 初始化數據庫
pnpm db:push

# （可選）填充測試數據
npx tsx scripts/seed.ts

# 啟動開發服務器
pnpm dev
```

訪問 http://localhost:3000 查看應用。

### 環境變量配置

創建 `.env` 文件並配置以下變量：

```env
# 數據庫
DATABASE_URL=mysql://username:password@localhost:3306/admin_dashboard

# JWT密鑰
JWT_SECRET=your-super-secret-jwt-key

# OAuth（可選）
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id

# 應用配置
VITE_APP_TITLE=Protocol Bank Admin Dashboard
VITE_APP_LOGO=https://your-logo-url.com/logo.png
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Admin

# LLM API（用於AI分析）
BUILT_IN_FORGE_API_URL=https://your-llm-api-url
BUILT_IN_FORGE_API_KEY=your-llm-api-key
```

## 📖 使用指南

### 登錄系統

1. 訪問管理後台首頁
2. 點擊"登錄"按鈕
3. 使用OAuth或配置的認證方式登錄
4. 首次登錄的用戶會自動創建帳戶

### 查看儀表板

登錄後，您將看到：
- 總交易數和待處理交易
- 已確認交易和成功率
- 需要審核的標記交易
- 活躍帳戶統計

### 管理交易

1. 點擊側邊欄的"交易管理"
2. 使用篩選器查找特定交易
3. 點擊"AI分析"按鈕查看交易詳情
4. 系統會自動進行AI風險分析
5. 根據AI建議批准、標記或拒絕交易

### AI分析功能

點擊任意交易的"AI分析"按鈕後：

1. **查看基本信息**
   - 交易哈希、金額、地址
   - 區塊號、Gas費用
   - 當前狀態和風險分數

2. **開始AI分析**
   - 點擊"開始AI分析"按鈕
   - AI會分析交易的多個維度
   - 生成詳細的風險評估報告

3. **查看分析結果**
   - **風險評估**: 整體風險描述
   - **異常指標**: 具體的可疑點
   - **建議操作**: 批准/標記/拒絕
   - **置信度**: 高/中/低
   - **詳細分析**: AI的推理過程

4. **執行操作**
   - 批准交易：將狀態更新為"已確認"
   - 標記為可疑：保持標記狀態，記錄AI分析
   - 拒絕交易：將狀態更新為"失敗"

### 管理帳戶

1. 點擊"帳戶管理"查看所有用戶帳戶
2. 查看KYC狀態和風險等級
3. 監控帳戶餘額和交易歷史
4. 更新帳戶狀態

## 🏗️ 項目結構

```
admin-dashboard/
├── client/                 # 前端代碼
│   ├── src/
│   │   ├── components/    # UI組件
│   │   │   ├── ui/       # shadcn/ui組件
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── TransactionDetailDialog.tsx
│   │   ├── pages/        # 頁面組件
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   └── Accounts.tsx
│   │   ├── lib/          # 工具函數
│   │   └── App.tsx       # 應用入口
│   └── index.html
├── server/                # 後端代碼
│   ├── _core/            # 核心功能
│   │   ├── llm.ts       # LLM集成
│   │   ├── oauth.ts     # OAuth認證
│   │   └── trpc.ts      # tRPC配置
│   ├── db.ts            # 數據庫查詢
│   └── routers.ts       # API路由
├── drizzle/              # 數據庫架構
│   └── schema.ts
├── scripts/              # 工具腳本
│   └── seed.ts          # 測試數據
└── package.json
```

## 🔒 安全特性

- **JWT身份驗證**: 安全的會話管理
- **基於角色的訪問控制**: 管理員權限管理
- **審計日誌**: 完整的操作記錄
- **SQL注入防護**: 使用參數化查詢
- **XSS防護**: 輸入驗證和輸出轉義
- **CSRF防護**: Token驗證

## 📊 數據庫架構

### 主要表

- **users**: 用戶帳戶信息
- **transactions**: 交易記錄
- **accounts**: 客戶帳戶
- **audit_logs**: 審計日誌
- **analytics_snapshots**: 數據分析快照

詳細架構請查看 `drizzle/schema.ts`

## 🎨 UI設計

管理後台採用與Protocol Bank主站一致的視覺風格：

- **字體**: Inter (Google Fonts)
- **配色**: 極簡黑白灰 + 藍色強調
- **效果**: 玻璃態（Glassmorphism）
- **動畫**: 流暢的過渡效果
- **響應式**: 完美支持移動端

## 🧪 測試

```bash
# 運行單元測試
pnpm test

# 運行集成測試
pnpm test:integration

# 生成測試覆蓋率報告
pnpm test:coverage
```

## 📦 構建和部署

### 開發環境

```bash
pnpm dev
```

### 生產構建

```bash
# 構建前端
pnpm build

# 啟動生產服務器
pnpm start
```

### Docker部署

```bash
# 構建鏡像
docker build -t protocol-bank-admin .

# 運行容器
docker run -p 3000:3000 --env-file .env protocol-bank-admin
```

### AWS部署

詳細的AWS部署指南請查看 [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)

## 🔧 開發指南

### 添加新功能

1. 在 `drizzle/schema.ts` 中定義數據模型
2. 在 `server/db.ts` 中添加查詢函數
3. 在 `server/routers.ts` 中創建API端點
4. 在 `client/src/pages/` 中創建UI組件
5. 在 `client/src/App.tsx` 中添加路由

### 代碼規範

- 使用TypeScript進行類型檢查
- 遵循ESLint規則
- 使用Prettier格式化代碼
- 編寫有意義的提交信息

### Git工作流

```bash
# 創建功能分支
git checkout -b feature/your-feature-name

# 提交更改
git add .
git commit -m "feat: add your feature"

# 推送到遠程
git push origin feature/your-feature-name

# 創建Pull Request
```

## 🐛 故障排除

### 數據庫連接失敗

1. 檢查 `DATABASE_URL` 格式
2. 確認數據庫服務正在運行
3. 驗證用戶名和密碼

### AI分析不工作

1. 檢查LLM API配置
2. 確認API密鑰有效
3. 查看服務器日誌

### 前端無法連接後端

1. 確認後端服務正在運行
2. 檢查CORS配置
3. 驗證API端點URL

## 📝 更新日誌

### v1.0.0 (2025-11-01)

#### 新功能
- ✅ 完整的管理後台框架
- ✅ 儀表板統計和可視化
- ✅ 交易管理（列表、詳情、篩選）
- ✅ AI驅動的異常交易檢測
- ✅ 帳戶管理和KYC追蹤
- ✅ 審計日誌系統
- ✅ 響應式設計

#### 技術亮點
- 🚀 基於React 19和TypeScript
- 🎨 使用shadcn/ui組件庫
- 🔒 JWT身份驗證
- 🤖 LLM集成進行AI分析
- 📊 tRPC端到端類型安全

## 🤝 貢獻

歡迎貢獻代碼！請遵循以下步驟：

1. Fork本倉庫
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建Pull Request

## 📄 許可證

本項目採用 MIT 許可證。

## 📧 聯繫方式

- GitHub: https://github.com/everest-an/Protocol-Bank
- 問題反饋: 在GitHub上創建Issue

## 🙏 致謝

- [shadcn/ui](https://ui.shadcn.com/) - 優秀的UI組件庫
- [tRPC](https://trpc.io/) - 類型安全的API框架
- [Drizzle ORM](https://orm.drizzle.team/) - 現代化的ORM
- [Tailwind CSS](https://tailwindcss.com/) - 實用優先的CSS框架

---

**Protocol Bank Admin Dashboard** - 由 Manus AI 驅動開發 🚀
