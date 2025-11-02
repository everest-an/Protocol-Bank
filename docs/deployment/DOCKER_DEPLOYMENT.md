# Protocol Bank - Docker 生产环境部署指南

## 概述

本文档描述了Protocol Bank使用Docker和Docker Compose的生产环境部署流程。

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank

# 配置环境变量
cp .env.example .env
nano .env

# 启动服务
docker-compose up -d

# 验证部署
docker-compose ps
curl http://localhost:3001/health
```

---

## 系统要求

- Docker Engine 24.0+
- Docker Compose 2.20+
- 最少4GB RAM
- 最少20GB存储空间

---

## 服务说明

### PostgreSQL
- 端口: 5432
- 数据持久化: postgres_data volume
- 自动初始化所有数据库schema

### Backend API
- 端口: 3001
- Node.js 22
- Socket.IO支持
- 健康检查: /health

### Frontend
- 端口: 8080
- Nginx + React
- 代理后端API和WebSocket

---

## 环境变量

编辑 `.env` 文件：

```env
DB_PASSWORD=your_secure_password
FIREFLY_III_URL=https://your-firefly-instance.com
FIREFLY_III_TOKEN=your_token
VITE_API_URL=http://your-domain.com
```

---

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新服务
git pull
docker-compose build
docker-compose up -d

# 备份数据库
docker-compose exec -T postgres pg_dump -U postgres protocol_bank > backup.sql
```

---

## CI/CD

GitHub Actions自动部署配置已包含在 `.github/workflows/deploy.yml`

需要配置的GitHub Secrets:
- DOCKER_USERNAME
- DOCKER_PASSWORD
- DEPLOY_HOST
- DEPLOY_USER
- DEPLOY_KEY

---

**详细文档请参考**: [完整部署指南](./DEPLOYMENT.md)
