#!/bin/bash
# verify-contracts.sh - Verify Protocol Bank contracts on Sepolia

echo "🔍 Verifying Protocol Bank Contracts on Sepolia..."
echo ""

echo "1️⃣ Verifying Mock USDC..."
npx hardhat verify --network sepolia \
  0x51eDB4f010A695fb727C537F0B2463E632d4b026 \
  "Mock USDC" "USDC" 6

echo ""
echo "2️⃣ Verifying Mock DAI..."
npx hardhat verify --network sepolia \
  0xc4844510f5954a27db7452754604C074a07066Fb \
  "Mock DAI" "DAI" 18

echo ""
echo "3️⃣ Verifying StreamPayment..."
npx hardhat verify --network sepolia \
  0x642B0c309358D083EE83748b4C22572aa28AebF7

echo ""
echo "✅ Verification complete!"
echo ""
echo "Check results at:"
echo "- Mock USDC: https://sepolia.etherscan.io/address/0x51eDB4f010A695fb727C537F0B2463E632d4b026#code"
echo "- Mock DAI: https://sepolia.etherscan.io/address/0xc4844510f5954a27db7452754604C074a07066Fb#code"
echo "- StreamPayment: https://sepolia.etherscan.io/address/0x642B0c309358D083EE83748b4C22572aa28AebF7#code"
