# Protocol Bank - Windows用户快速部署指南

本指南专为Windows用户设计，帮助您快速在AWS上部署Protocol Bank后端服务。

---

## 第一步：安装必要工具

### 1.1 安装Git for Windows

1. 下载Git：https://git-scm.com/download/win
2. 运行安装程序，使用默认设置即可
3. 安装完成后，重启PowerShell

### 1.2 安装AWS CLI

1. 下载AWS CLI：https://awscli.amazonaws.com/AWSCLIV2.msi
2. 双击运行安装程序
3. 按照向导完成安装
4. 安装完成后，重启PowerShell

### 1.3 验证安装

打开PowerShell，执行：
```powershell
git --version
aws --version
```

如果都显示版本号，说明安装成功！

---

## 第二步：配置AWS CLI

### 2.1 获取AWS访问密钥

1. 访问：https://console.aws.amazon.com/iam/
2. 点击左侧"用户" → 选择您的用户名
3. 点击"安全凭证"标签
4. 点击"创建访问密钥"
5. 选择"命令行界面(CLI)"
6. 复制**Access Key ID**和**Secret Access Key**

### 2.2 配置AWS CLI

在PowerShell中执行：
```powershell
aws configure
```

按提示输入：
- **AWS Access Key ID**: [粘贴您的Access Key]
- **AWS Secret Access Key**: [粘贴您的Secret Key]
- **Default region name**: `ap-southeast-2`
- **Default output format**: `json`

### 2.3 验证配置

```powershell
aws sts get-caller-identity
```

如果显示您的账户信息，说明配置成功！

---

## 第三步：创建EC2密钥对

### 3.1 访问AWS控制台

1. 打开：https://ap-southeast-2.console.aws.amazon.com/ec2/
2. 确保右上角区域是"亚太地区（悉尼）ap-southeast-2"

### 3.2 创建密钥对

1. 左侧菜单：**网络与安全** → **密钥对**
2. 点击**创建密钥对**
3. 填写信息：
   - **名称**: `protocol-bank-key`
   - **密钥对类型**: `RSA`
   - **私有密钥文件格式**: `.pem`
4. 点击**创建密钥对**
5. 浏览器会自动下载`protocol-bank-key.pem`
6. 将文件保存到安全位置（例如：`C:\Users\您的用户名\.ssh\`）

---

## 第四步：下载部署文件

### 4.1 打开PowerShell

按`Win + X`，选择"Windows PowerShell"

### 4.2 克隆代码仓库

```powershell
cd ~
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank\aws-deployment
```

### 4.3 检查文件

```powershell
ls
```

您应该看到：
- `cloudformation-template.yaml`
- `deploy.ps1`（PowerShell脚本）
- `deploy.sh`（Linux脚本，Windows不需要）

---

## 第五步：运行部署脚本

### 5.1 设置执行策略（首次运行需要）

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

输入`Y`确认

### 5.2 运行部署脚本

```powershell
.\deploy.ps1
```

### 5.3 按提示输入信息

#### 提示1：EC2密钥对名称
```
Enter your EC2 Key Pair name (for SSH access):
```
**输入**: `protocol-bank-key`

#### 提示2：数据库密码
```
Enter database password (minimum 8 characters):
```
**输入**: 创建一个强密码（至少8个字符），例如：`MySecure123!`
**注意**: 输入时不会显示字符

#### 提示3：EC2实例类型
```
Enter EC2 instance type (default: t3.small, press Enter to use default):
```
**建议**: 直接按回车使用默认值

#### 提示4：RDS实例类型
```
Enter RDS instance class (default: db.t3.micro, press Enter to use default):
```
**建议**: 直接按回车使用默认值

#### 提示5：确认部署
```
Continue with deployment? (yes/no):
```
**输入**: `yes`

### 5.4 等待部署完成

脚本会显示进度，**请耐心等待10-15分钟**。

### 5.5 部署成功

看到以下信息说明部署成功：
```
=========================================
✓ Deployment completed successfully!
=========================================

Backend API URL: http://13.XXX.XXX.XXX:3001
EC2 Public IP: 13.XXX.XXX.XXX
...
```

**重要**: 复制保存**Backend API URL**！

---

## 第六步：更新前端配置

### 6.1 登录Vercel

1. 访问：https://vercel.com/
2. 选择`Protocol-Bank`项目
3. 点击**Settings** → **Environment Variables**

### 6.2 添加环境变量

- **Key**: `VITE_API_BASE_URL`
- **Value**: `http://YOUR_EC2_IP:3001`（使用脚本输出的Backend API URL）
- 点击**Save**

### 6.3 重新部署

1. 点击**Deployments**
2. 点击**Redeploy**
3. 等待2-3分钟

---

## 第七步：验证部署

### 7.1 测试后端API

在PowerShell执行：
```powershell
Invoke-WebRequest -Uri http://YOUR_EC2_IP:3001/health
```

应该返回状态码200

### 7.2 测试前端

访问：https://protocolbanks.com

检查所有功能是否正常工作！

---

## 常见问题

### Q: PowerShell提示"无法识别git"
**解决**: 
1. 确保已安装Git for Windows
2. 重启PowerShell
3. 如果还不行，重启电脑

### Q: 执行策略错误
**解决**: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q: 部署失败
**解决**: 
1. 检查AWS CLI配置：`aws configure list`
2. 检查AWS权限
3. 查看CloudFormation控制台的错误信息

### Q: 如何删除部署？
**解决**: 
1. 访问：https://ap-southeast-2.console.aws.amazon.com/cloudformation
2. 选择`protocol-bank-stack`
3. 点击**删除**

---

## 成本估算

**月度成本**（ap-southeast-2区域）：
- EC2 t3.small: ~$30/月
- RDS db.t3.micro: ~$25/月
- 数据传输: ~$5/月
- **总计**: ~$60/月

---

## 需要帮助？

如果遇到任何问题，请随时提出！

**部署完成后，记得更改您的AWS密码以确保安全！**
