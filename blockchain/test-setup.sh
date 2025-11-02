#!/bin/bash

# ClearingHouse Test Setup Script
# This script sets up the testing environment for the ClearingHouse smart contract

set -e

echo "========================================="
echo "ClearingHouse Test Setup"
echo "========================================="
echo ""

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry is not installed"
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    source ~/.bashrc
    foundryup
    echo "✅ Foundry installed successfully"
else
    echo "✅ Foundry is already installed"
    forge --version
fi

echo ""
echo "Installing dependencies..."

# Initialize Foundry project if not already initialized
if [ ! -f "foundry.toml" ]; then
    echo "Initializing Foundry project..."
    forge init --no-commit --force
fi

# Install OpenZeppelin contracts
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "Installing OpenZeppelin contracts..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
else
    echo "✅ OpenZeppelin contracts already installed"
fi

# Install Forge Standard Library
if [ ! -d "lib/forge-std" ]; then
    echo "Installing Forge Standard Library..."
    forge install foundry-rs/forge-std --no-commit
else
    echo "✅ Forge Standard Library already installed"
fi

echo ""
echo "Building contracts..."
forge build

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "You can now run tests with:"
echo "  forge test                    # Run all tests"
echo "  forge test -vvv               # Run with verbose output"
echo "  forge test --gas-report       # Run with gas report"
echo "  forge coverage                # Generate coverage report"
echo ""
echo "To run specific tests:"
echo "  forge test --match-test test_SettleTransaction_BalancedPositions -vvv"
echo ""
