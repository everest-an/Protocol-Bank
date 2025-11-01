# Protocol Bank AWS部署 - 详细分步指南

本指南将手把手教您完成Protocol Bank的AWS部署，包括创建EC2密钥对、配置AWS CLI和运行部署脚本。

---

## 第一步：创建EC2密钥对

### 1.1 登录AWS控制台
1. 打开浏览器，访问：https://console.aws.amazon.com/
2. 使用您的AWS账户登录

### 1.2 切换到悉尼区域
1. 在AWS控制台右上角，点击区域选择器
2. 选择 **亚太地区（悉尼）ap-southeast-2**

### 1.3 进入EC2服务
1. 在顶部搜索框输入 "EC2"
2. 点击 "EC2" 进入EC2控制台

### 1.4 创建密钥对
1. 在左侧菜单中，找到 **"网络与安全"** → **"密钥对"**
2. 点击右上角的 **"创建密钥对"** 按钮
3. 填写以下信息：
   - **名称**：`protocol-bank-key`（记住这个名称，稍后会用到）
   - **密钥对类型**：选择 `RSA`
   - **私有密钥文件格式**：选择 `.pem`
4. 点击 **"创建密钥对"**
5. 浏览器会自动下载 `protocol-bank-key.pem` 文件
6. **重要**：将这个文件保存到安全的位置，不要丢失！

### 1.5 设置密钥文件权限（Mac/Linux用户）
打开终端，执行：
```bash
chmod 400 ~/Downloads/protocol-bank-key.pem
```

---

## 第二步：安装和配置AWS CLI

### 2.1 检查是否已安装AWS CLI
打开终端，执行：
```bash
aws --version
```

如果显示版本号，说明已安装，跳到步骤2.3。

### 2.2 安装AWS CLI（如果未安装）

**Mac用户**：
```bash
brew install awscli
```

**Windows用户**：
1. 下载安装程序：https://awscli.amazonaws.com/AWSCLIV2.msi
2. 双击运行安装程序

**Linux用户**：
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2.3 配置AWS CLI
1. 在终端执行：
```bash
aws configure
```

2. 按提示输入以下信息：

**AWS Access Key ID**：
- 如果您还没有，需要创建：
  1. 访问 https://console.aws.amazon.com/iam/
  2. 点击左侧 "用户" → 选择您的用户名
  3. 点击 "安全凭证" 标签
  4. 点击 "创建访问密钥"
  5. 选择 "命令行界面(CLI)"
  6. 复制 **Access Key ID** 和 **Secret Access Key**

**AWS Secret Access Key**：
- 在创建访问密钥时一起显示的密钥

**Default region name**：
- 输入：`ap-southeast-2`

**Default output format**：
- 输入：`json`

### 2.4 验证配置
执行以下命令验证配置是否成功：
```bash
aws sts get-caller-identity
```

如果显示您的账户信息，说明配置成功！

---

## 第三步：下载部署文件

### 3.1 克隆GitHub仓库
打开终端，执行：
```bash
cd ~
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank/aws-deployment
```

### 3.2 检查文件
执行：
```bash
ls -la
```

您应该看到以下文件：
- `cloudformation-template.yaml`
- `deploy.sh`
- `AWS_DEPLOYMENT_GUIDE.md`

---

## 第四步：运行部署脚本

### 4.1 确保脚本可执行
```bash
chmod +x deploy.sh
```

### 4.2 运行脚本
```bash
./deploy.sh
```

### 4.3 按提示输入信息

脚本会依次提示您输入以下信息：

#### 提示1：EC2密钥对名称
```
Enter your EC2 Key Pair name (for SSH access):
```
**输入**：`protocol-bank-key`（就是第一步创建的密钥对名称）

#### 提示2：数据库密码
```
Enter database password (minimum 8 characters):
```
**输入**：创建一个强密码，至少8个字符，例如：`MySecurePass123!`
**注意**：输入时不会显示字符，这是正常的安全措施

#### 提示3：EC2实例类型
```
Enter EC2 instance type (default: t3.small):
```
**建议**：直接按回车使用默认值 `t3.small`
- 如果预算有限，可以输入 `t3.micro`（但性能较低）

#### 提示4：RDS实例类型
```
Enter RDS instance class (default: db.t3.micro):
```
**建议**：直接按回车使用默认值 `db.t3.micro`

#### 提示5：确认部署
```
Continue with deployment? (yes/no):
```
**输入**：`yes`

### 4.4 等待部署完成

脚本会显示：
```
Starting deployment...
✓ CloudFormation stack creation initiated
Waiting for stack creation to complete...
This may take 10-15 minutes...
```

**请耐心等待10-15分钟**，脚本会自动完成以下操作：
- 创建VPC和子网
- 创建安全组
- 创建RDS PostgreSQL数据库
- 创建EC2实例
- 安装Docker和Node.js
- 克隆代码并启动服务

### 4.5 部署成功

当看到以下信息时，说明部署成功：
```
=========================================
✓ Deployment completed successfully!
=========================================

Deployment Information:
Backend API URL: http://13.XXX.XXX.XXX:3001
EC2 Public IP: 13.XXX.XXX.XXX
Database Endpoint: protocol-bank-db.XXXXX.ap-southeast-2.rds.amazonaws.com

SSH Command:
  ssh -i protocol-bank-key.pem ubuntu@13.XXX.XXX.XXX
```

**重要**：请复制保存这些信息，特别是 **Backend API URL**！

---

## 第五步：更新前端配置

### 5.1 更新Vercel环境变量

1. 访问 https://vercel.com/
2. 登录您的账户
3. 选择 `Protocol-Bank` 项目
4. 点击 **"Settings"** → **"Environment Variables"**
5. 添加或更新以下变量：
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `http://YOUR_EC2_IP:3001`（使用脚本输出的Backend API URL）
6. 点击 **"Save"**

### 5.2 触发重新部署

1. 在Vercel项目页面，点击 **"Deployments"**
2. 点击右上角的 **"Redeploy"** 按钮
3. 等待2-3分钟完成部署

---

## 第六步：验证部署

### 6.1 测试后端API
在终端执行：
```bash
curl http://YOUR_EC2_IP:3001/health
```

应该返回：
```json
{"status":"ok","timestamp":"..."}
```

### 6.2 测试前端
1. 打开浏览器，访问 https://protocolbanks.com
2. 检查所有功能是否正常工作
3. 尝试创建账户、转账等操作

---

## 常见问题

### Q1: 脚本提示"AWS CLI is not configured"
**解决**：重新执行 `aws configure` 配置AWS CLI

### Q2: 部署失败，显示权限错误
**解决**：确保您的AWS账户有创建EC2、RDS、VPC等资源的权限

### Q3: 如何查看服务器日志？
**解决**：SSH登录服务器后执行：
```bash
ssh -i protocol-bank-key.pem ubuntu@YOUR_EC2_IP
sudo journalctl -u protocol-bank -f
```

### Q4: 如何删除部署？
**解决**：
1. 访问 https://ap-southeast-2.console.aws.amazon.com/cloudformation
2. 选择 `protocol-bank-stack`
3. 点击 **"删除"**

### Q5: 忘记数据库密码怎么办？
**解决**：需要删除堆栈并重新部署，或在RDS控制台重置密码

---

## 成本估算

**月度成本**（ap-southeast-2区域）：
- EC2 t3.small: ~$30/月
- RDS db.t3.micro: ~$25/月
- 数据传输: ~$5/月
- **总计**: ~$60/月

**节省成本的建议**：
- 使用 t3.micro 实例（降低到~$40/月）
- 使用预留实例（节省30-50%）
- 设置自动关机（非工作时间）

---

## 下一步

部署完成后，您可以：
1. 配置域名和SSL证书
2. 设置CloudWatch监控和告警
3. 配置自动备份
4. 优化性能和安全设置

如有任何问题，请随时提出！
