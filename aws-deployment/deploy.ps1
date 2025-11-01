# Protocol Bank AWS Deployment Script for Windows PowerShell
# Author: Manus AI

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Protocol Bank AWS Deployment (Windows)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Please install AWS CLI first: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "Download: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    exit 1
}

# Check if AWS is configured
try {
    $identity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not configured"
    }
    Write-Host "✓ AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: AWS CLI is not configured" -ForegroundColor Red
    Write-Host "Please run 'aws configure' first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get parameters
$KeyPairName = Read-Host "Enter your EC2 Key Pair name (for SSH access)"
$DBPassword = Read-Host "Enter database password (minimum 8 characters)" -AsSecureString
$DBPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DBPassword))

if ($DBPasswordPlain.Length -lt 8) {
    Write-Host "✗ Error: Password must be at least 8 characters" -ForegroundColor Red
    exit 1
}

$InstanceType = Read-Host "Enter EC2 instance type (default: t3.small, press Enter to use default)"
if ([string]::IsNullOrWhiteSpace($InstanceType)) {
    $InstanceType = "t3.small"
}

$DBInstanceClass = Read-Host "Enter RDS instance class (default: db.t3.micro, press Enter to use default)"
if ([string]::IsNullOrWhiteSpace($DBInstanceClass)) {
    $DBInstanceClass = "db.t3.micro"
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Region: ap-southeast-2 (Sydney)"
Write-Host "Key Pair: $KeyPairName"
Write-Host "EC2 Instance: $InstanceType"
Write-Host "RDS Instance: $DBInstanceClass"
Write-Host ""

$Confirm = Read-Host "Continue with deployment? (yes/no)"
if ($Confirm -ne "yes") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting deployment..." -ForegroundColor Yellow
Write-Host ""

# Stack name
$StackName = "protocol-bank-stack"

# Get the directory where the script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TemplateFile = Join-Path $ScriptDir "cloudformation-template.yaml"

# Check if template file exists
if (-not (Test-Path $TemplateFile)) {
    Write-Host "✗ Error: CloudFormation template not found at $TemplateFile" -ForegroundColor Red
    exit 1
}

# Create CloudFormation stack
try {
    Write-Host "Creating CloudFormation stack..." -ForegroundColor Yellow
    
    aws cloudformation create-stack `
        --stack-name $StackName `
        --template-body "file://$TemplateFile" `
        --parameters `
            "ParameterKey=KeyPairName,ParameterValue=$KeyPairName" `
            "ParameterKey=DBPassword,ParameterValue=$DBPasswordPlain" `
            "ParameterKey=InstanceType,ParameterValue=$InstanceType" `
            "ParameterKey=DBInstanceClass,ParameterValue=$DBInstanceClass" `
        --capabilities CAPABILITY_IAM `
        --region ap-southeast-2
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create stack"
    }
    
    Write-Host ""
    Write-Host "✓ CloudFormation stack creation initiated" -ForegroundColor Green
    Write-Host ""
    Write-Host "Stack Name: $StackName" -ForegroundColor Cyan
    Write-Host "Region: ap-southeast-2" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Waiting for stack creation to complete..." -ForegroundColor Yellow
    Write-Host "This may take 10-15 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    # Wait for stack creation
    aws cloudformation wait stack-create-complete `
        --stack-name $StackName `
        --region ap-southeast-2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        
        # Get outputs
        Write-Host "Retrieving deployment information..." -ForegroundColor Yellow
        Write-Host ""
        
        $outputs = aws cloudformation describe-stacks `
            --stack-name $StackName `
            --region ap-southeast-2 `
            --query 'Stacks[0].Outputs' `
            --output json | ConvertFrom-Json
        
        $ec2IP = ($outputs | Where-Object { $_.OutputKey -eq "EC2PublicIP" }).OutputValue
        $apiURL = ($outputs | Where-Object { $_.OutputKey -eq "BackendAPIURL" }).OutputValue
        $dbEndpoint = ($outputs | Where-Object { $_.OutputKey -eq "DatabaseEndpoint" }).OutputValue
        
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Deployment Information:" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Backend API URL: $apiURL" -ForegroundColor White
        Write-Host "EC2 Public IP: $ec2IP" -ForegroundColor White
        Write-Host "Database Endpoint: $dbEndpoint" -ForegroundColor White
        Write-Host ""
        Write-Host "SSH Command:" -ForegroundColor Yellow
        Write-Host "  ssh -i $KeyPairName.pem ubuntu@$ec2IP" -ForegroundColor White
        Write-Host ""
        Write-Host "API Health Check:" -ForegroundColor Yellow
        Write-Host "  curl $apiURL/health" -ForegroundColor White
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Update your frontend .env file with:" -ForegroundColor White
        Write-Host "   VITE_API_BASE_URL=$apiURL" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "2. Redeploy your frontend on Vercel" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Test the API:" -ForegroundColor White
        Write-Host "   Invoke-WebRequest -Uri $apiURL/health" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✓ Deployment completed!" -ForegroundColor Green
    } else {
        throw "Stack creation failed or timed out"
    }
    
} catch {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the AWS CloudFormation console for error details:" -ForegroundColor Yellow
    Write-Host "https://ap-southeast-2.console.aws.amazon.com/cloudformation" -ForegroundColor Cyan
    exit 1
}
