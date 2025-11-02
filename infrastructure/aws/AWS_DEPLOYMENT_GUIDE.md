
> **部署方式**: AWS CloudFormation + 自动化脚本
> **区域**: ap-southeast-2 (悉尼)
> **预计时间**: 15-20分钟
> **作者**: EverestAn

# Protocol Bank - AWS生产环境部署指南

本指南将引导您使用AWS CloudFormation和自动化脚本，在AWS上快速部署Protocol Bank的后端服务。您只需要按照步骤操作，即可在15-20分钟内完成部署。

---

## 1. 部署前准备

在开始部署之前，请确保您已完成以下准备工作：

### 1.1. AWS账户
- 您需要一个有效的AWS账户。

### 1.2. AWS CLI
- 在您的本地计算机上安装并配置AWS CLI。
- 安装指南: [https://aws.amazon.com/cli/](https://aws.amazon.com/cli/)
- 配置命令: `aws configure`

### 1.3. EC2密钥对
- 在AWS控制台创建一个EC2密钥对，用于SSH访问服务器。
- **区域**: `ap-southeast-2` (悉尼)
- **格式**: `.pem`
- 创建后下载并妥善保管密钥文件。

![Create Key Pair](https://docs.aws.amazon.com/images/AWSEC2/latest/UserGuide/images/create-key-pair-console.png)

### 1.4. 下载部署文件
- 下载本部署包中的所有文件，并解压到您的本地计算机。

---

## 2. 自动化部署

我们提供了一个自动化部署脚本，可以一键完成所有操作。

### 2.1. 打开终端
- 在您的本地计算机上打开终端或命令行工具。

### 2.2. 导航到部署目录
- 使用`cd`命令进入您解压部署文件的目录。

### 2.3. 运行部署脚本
- 执行以下命令：
```bash
./deploy.sh
```

### 2.4. 输入参数
- 脚本会提示您输入之前创建的**EC2密钥对名称**和**数据库密码**。

### 2.5. 等待部署完成
- 脚本会自动创建CloudFormation堆栈，并等待所有资源创建完成。
- 这个过程大约需要**10-15分钟**。

### 2.6. 部署成功
- 部署成功后，脚本会输出后端API地址、服务器IP和数据库地址等信息。

---

## 3. 手动部署（备用方案）

如果您不想使用脚本，也可以手动通过AWS控制台部署。

### 3.1. 登录AWS控制台
- [https://ap-southeast-2.console.aws.amazon.com/cloudformation](https://ap-southeast-2.console.aws.amazon.com/cloudformation)

### 3.2. 创建堆栈
- 点击"创建堆栈" → "使用新资源(标准)"。

### 3.3. 上传模板
- 选择"上传模板文件"，然后选择`cloudformation-template.yaml`文件。

### 3.4. 配置参数
- **堆栈名称**: `protocol-bank-stack`
- **EC2密钥对**: 选择您创建的密钥对
- **数据库密码**: 输入一个强密码

### 3.5. 创建堆栈
- 点击"下一步" → "下一步" → "创建堆栈"。

### 3.6. 等待完成
- 等待堆栈状态变为`CREATE_COMPLETE`。

---

## 4. 部署后配置

### 4.1. 更新前端环境变量
- 部署成功后，您会得到一个后端API地址。
- 打开您的前端项目（`Protocol-Bank`）中的`.env`文件。
- 更新`VITE_API_BASE_URL`为您的后端API地址：
```
VITE_API_BASE_URL=http://YOUR_EC2_IP:3001
```

### 4.2. 重新部署前端
- 提交代码到GitHub，Vercel会自动重新部署前端应用。

### 4.3. 验证部署
- 打开浏览器，访问您的前端应用（`https://protocolbanks.com`）。
- 检查所有功能是否正常工作。
- 您也可以通过`curl http://YOUR_EC2_IP:3001/health`来检查后端健康状态。

---

## 5. 常见问题

- **部署失败怎么办？**
  - 检查CloudFormation控制台的"事件"选项卡，查看详细的错误信息。
  - 确保您的AWS账户有足够的权限创建EC2和RDS等资源。

- **如何SSH登录服务器？**
  - `ssh -i your-key.pem ubuntu@YOUR_EC2_IP`

- **如何查看日志？**
  - `ssh`登录服务器后，执行`journalctl -u protocol-bank -f`。

- **如何删除部署？**
  - 在CloudFormation控制台，选择堆栈，然后点击"删除"。

---

部署完成！如果您有任何问题，请随时提出。
