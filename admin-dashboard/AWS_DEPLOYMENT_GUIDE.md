# Protocol Bank Admin Dashboard - AWS部署指南

## 項目概述

Protocol Bank管理後台是一個全棧Web應用，包含：
- **前端**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **後端**: Express 4 + tRPC 11 + Node.js
- **數據庫**: MySQL/TiDB (Drizzle ORM)
- **AI功能**: 集成LLM進行異常交易檢測

## 部署架構建議

### 方案一：單服務器部署（推薦用於開發/測試）

使用AWS EC2 + RDS部署完整應用

**所需資源：**
- EC2實例（t3.medium或更高）
- RDS MySQL實例（db.t3.micro或更高）
- Application Load Balancer（可選，用於HTTPS）
- Route 53（域名管理）

**部署步驟：**

1. **準備EC2實例**
```bash
# 連接到EC2實例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 安裝Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝pnpm
npm install -g pnpm

# 安裝PM2（進程管理器）
npm install -g pm2
```

2. **克隆代碼並安裝依賴**
```bash
cd /home/ubuntu
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank/admin-dashboard
pnpm install
```

3. **配置環境變量**

創建 `.env` 文件：
```env
# 數據庫配置
DATABASE_URL=mysql://username:password@your-rds-endpoint:3306/admin_dashboard

# JWT密鑰
JWT_SECRET=your-super-secret-jwt-key-change-this

# OAuth配置（如果使用Manus OAuth）
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id

# 應用配置
VITE_APP_TITLE=Protocol Bank Admin Dashboard
VITE_APP_LOGO=https://your-logo-url.com/logo.png
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Admin

# LLM API配置（用於AI分析）
BUILT_IN_FORGE_API_URL=https://your-llm-api-url
BUILT_IN_FORGE_API_KEY=your-llm-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://your-llm-api-url

# 生產環境
NODE_ENV=production
PORT=3000
```

4. **初始化數據庫**
```bash
# 推送數據庫架構
pnpm db:push

# （可選）填充測試數據
npx tsx scripts/seed.ts
```

5. **構建並啟動應用**
```bash
# 構建前端
pnpm build

# 使用PM2啟動應用
pm2 start server/_core/index.ts --name admin-dashboard --interpreter tsx
pm2 save
pm2 startup
```

6. **配置Nginx反向代理**

安裝Nginx：
```bash
sudo apt-get install nginx
```

創建Nginx配置 `/etc/nginx/sites-available/admin-dashboard`：
```nginx
server {
    listen 80;
    server_name protocolbanks.com;

    # 主站配置（假設在其他地方）
    location / {
        proxy_pass http://your-main-site;
    }

    # 管理後台配置
    location /admin {
        rewrite ^/admin(/.*)$ $1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API路由
    location /admin/api {
        rewrite ^/admin/api(/.*)$ /api$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

啟用配置：
```bash
sudo ln -s /etc/nginx/sites-available/admin-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **配置HTTPS（使用Let's Encrypt）**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d protocolbanks.com
```

### 方案二：容器化部署（推薦用於生產）

使用AWS ECS + RDS + ALB部署

**創建Dockerfile**（已包含在項目中）：
```dockerfile
FROM node:22-alpine

WORKDIR /app

# 安裝pnpm
RUN npm install -g pnpm

# 複製依賴文件
COPY package.json pnpm-lock.yaml ./

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製源代碼
COPY . .

# 構建前端
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["pnpm", "start"]
```

**部署步驟：**

1. 構建Docker鏡像並推送到ECR
2. 創建ECS任務定義
3. 配置ALB和目標組
4. 創建ECS服務
5. 配置Route 53指向ALB

## 環境變量說明

### 必需變量

| 變量名 | 說明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | MySQL數據庫連接字符串 | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | JWT簽名密鑰 | `your-secret-key` |
| `NODE_ENV` | 運行環境 | `production` |

### 可選變量（OAuth功能）

| 變量名 | 說明 |
|--------|------|
| `OAUTH_SERVER_URL` | OAuth服務器URL |
| `VITE_OAUTH_PORTAL_URL` | OAuth登錄頁面URL |
| `VITE_APP_ID` | OAuth應用ID |

### 可選變量（AI功能）

| 變量名 | 說明 |
|--------|------|
| `BUILT_IN_FORGE_API_URL` | LLM API URL |
| `BUILT_IN_FORGE_API_KEY` | LLM API密鑰 |

## 子路徑部署配置

如果要將管理後台部署在 `protocolbanks.com/admin` 路徑下，需要：

1. **更新Vite配置** (`vite.config.ts`)：
```typescript
export default defineConfig({
  base: '/admin/',
  // ... 其他配置
});
```

2. **更新路由配置** (`client/src/App.tsx`)：
```typescript
import { Router } from "wouter";

function App() {
  return (
    <Router base="/admin">
      {/* 路由配置 */}
    </Router>
  );
}
```

3. **重新構建應用**：
```bash
pnpm build
```

## 數據庫遷移

### 從開發環境遷移到生產環境

1. **導出開發數據庫架構**：
```bash
pnpm drizzle-kit generate
```

2. **在生產環境執行遷移**：
```bash
pnpm db:push
```

### 備份和恢復

**備份**：
```bash
mysqldump -h your-rds-endpoint -u username -p admin_dashboard > backup.sql
```

**恢復**：
```bash
mysql -h your-rds-endpoint -u username -p admin_dashboard < backup.sql
```

## 監控和日誌

### 使用PM2監控

```bash
# 查看應用狀態
pm2 status

# 查看日誌
pm2 logs admin-dashboard

# 監控資源使用
pm2 monit
```

### 使用CloudWatch

配置EC2實例將日誌發送到CloudWatch：
```bash
sudo apt-get install amazon-cloudwatch-agent
```

## 安全建議

1. **使用強密碼和密鑰**
   - 定期更換 `JWT_SECRET`
   - 使用AWS Secrets Manager存儲敏感信息

2. **配置安全組**
   - 僅允許必要的入站流量（80, 443）
   - 限制SSH訪問（僅允許特定IP）

3. **啟用HTTPS**
   - 使用Let's Encrypt或AWS Certificate Manager
   - 強制HTTPS重定向

4. **數據庫安全**
   - 使用私有子網部署RDS
   - 啟用自動備份
   - 定期更新數據庫密碼

5. **應用安全**
   - 定期更新依賴包
   - 啟用CORS限制
   - 實施速率限制

## 性能優化

1. **使用CDN**
   - 將靜態資源部署到CloudFront
   - 配置適當的緩存策略

2. **數據庫優化**
   - 添加適當的索引
   - 使用連接池
   - 啟用查詢緩存

3. **應用優化**
   - 啟用Gzip壓縮
   - 使用Redis緩存（可選）
   - 配置負載均衡

## 故障排除

### 應用無法啟動

1. 檢查環境變量是否正確配置
2. 查看PM2日誌：`pm2 logs admin-dashboard`
3. 檢查數據庫連接

### 數據庫連接失敗

1. 檢查 `DATABASE_URL` 格式
2. 確認RDS安全組允許EC2訪問
3. 測試數據庫連接：
```bash
mysql -h your-rds-endpoint -u username -p
```

### AI分析功能不工作

1. 檢查LLM API配置
2. 確認API密鑰有效
3. 查看服務器日誌中的錯誤信息

## 成本估算

### 基礎配置（開發/測試）
- EC2 t3.medium: ~$30/月
- RDS db.t3.micro: ~$15/月
- 數據傳輸: ~$5/月
- **總計**: ~$50/月

### 生產配置
- EC2 t3.large (x2): ~$120/月
- RDS db.t3.small: ~$30/月
- ALB: ~$20/月
- CloudFront: ~$10/月
- **總計**: ~$180/月

## 支持和維護

- GitHub倉庫: https://github.com/everest-an/Protocol-Bank
- 問題反饋: 在GitHub上創建Issue
- 技術文檔: 查看項目README.md

## 更新日誌

### v1.0.0 (2025-11-01)
- ✅ 初始版本發布
- ✅ 核心管理功能（交易、帳戶、儀表板）
- ✅ AI驅動的異常交易檢測
- ✅ 完整的審計日誌系統
- ✅ 響應式設計，匹配Protocol Bank視覺風格
