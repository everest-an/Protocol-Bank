#!/bin/bash

# Protocol Bank AWS Deployment Script
# This script helps you deploy Protocol Bank to AWS using CloudFormation

set -e

echo "========================================="
echo "Protocol Bank AWS Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI first: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured${NC}"
    echo "Please run 'aws configure' first"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI is configured${NC}"
echo ""

# Get parameters
read -p "Enter your EC2 Key Pair name (for SSH access): " KEY_PAIR_NAME
read -sp "Enter database password (minimum 8 characters): " DB_PASSWORD
echo ""
read -p "Enter EC2 instance type (default: t3.small): " INSTANCE_TYPE
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.small}
read -p "Enter RDS instance class (default: db.t3.micro): " DB_INSTANCE_CLASS
DB_INSTANCE_CLASS=${DB_INSTANCE_CLASS:-db.t3.micro}

echo ""
echo "========================================="
echo "Deployment Configuration:"
echo "========================================="
echo "Region: ap-southeast-2 (Sydney)"
echo "Key Pair: $KEY_PAIR_NAME"
echo "EC2 Instance: $INSTANCE_TYPE"
echo "RDS Instance: $DB_INSTANCE_CLASS"
echo ""

read -p "Continue with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting deployment...${NC}"
echo ""

# Create CloudFormation stack
STACK_NAME="protocol-bank-stack"

aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://cloudformation-template.yaml \
    --parameters \
        ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
        ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
        ParameterKey=InstanceType,ParameterValue=$INSTANCE_TYPE \
        ParameterKey=DBInstanceClass,ParameterValue=$DB_INSTANCE_CLASS \
    --capabilities CAPABILITY_IAM \
    --region ap-southeast-2

echo ""
echo -e "${GREEN}✓ CloudFormation stack creation initiated${NC}"
echo ""
echo "Stack Name: $STACK_NAME"
echo "Region: ap-southeast-2"
echo ""
echo -e "${YELLOW}Waiting for stack creation to complete...${NC}"
echo "This may take 10-15 minutes..."
echo ""

# Wait for stack creation
aws cloudformation wait stack-create-complete \
    --stack-name $STACK_NAME \
    --region ap-southeast-2

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    
    # Get outputs
    echo "Retrieving deployment information..."
    echo ""
    
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region ap-southeast-2 \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    EC2_IP=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="EC2PublicIP") | .OutputValue')
    API_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="BackendAPIURL") | .OutputValue')
    DB_ENDPOINT=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DatabaseEndpoint") | .OutputValue')
    
    echo "========================================="
    echo "Deployment Information:"
    echo "========================================="
    echo "Backend API URL: $API_URL"
    echo "EC2 Public IP: $EC2_IP"
    echo "Database Endpoint: $DB_ENDPOINT"
    echo ""
    echo "SSH Command:"
    echo "  ssh -i $KEY_PAIR_NAME.pem ubuntu@$EC2_IP"
    echo ""
    echo "API Health Check:"
    echo "  curl $API_URL/health"
    echo ""
    echo "========================================="
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Update your frontend .env file with:"
    echo "   VITE_API_BASE_URL=$API_URL"
    echo ""
    echo "2. Redeploy your frontend on Vercel"
    echo ""
    echo "3. Test the API:"
    echo "   curl $API_URL/health"
    echo ""
    echo -e "${GREEN}Deployment completed!${NC}"
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}✗ Deployment failed${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Please check the AWS CloudFormation console for error details:"
    echo "https://ap-southeast-2.console.aws.amazon.com/cloudformation"
    exit 1
fi
