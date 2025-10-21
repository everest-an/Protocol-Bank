# Protocol Bank

> **🌐 Live Demo**: [https://www.protocolbanks.com/](https://www.protocolbanks.com/)  
> **📝 Team**: Richard  
> **🏆 ETHShanghai 2025 Hackathon Project**

---

## 🚀 Quick Links

- **🌐 Official Website**: [https://www.protocolbanks.com/](https://www.protocolbanks.com/)
- **📜 Smart Contracts**: [View Contracts](#-smart-contracts)
- **📖 Documentation**: [Full Documentation](./docs/)
- **🎥 Demo Video**: [Coming Soon]

---

## 📋 Overview

Protocol Bank is a cutting-edge digital banking platform designed to revolutionize global payments by seamlessly integrating traditional fiat services with the innovative world of cryptocurrencies. Positioned as a blockchain-based competitor to SWIFT, Protocol Bank aims to address the inefficiencies, high costs, and lack of transparency prevalent in existing cross-border payment systems.

---

## 🎯 Problems Solved

Traditional global payment systems, such as SWIFT, are often characterized by:

- **High Fees**: Multiple intermediary banks lead to cumulative transaction costs.
- **Slow Settlement Times**: Payments can take days to clear due to batch processing and fragmented national systems.
- **Lack of Transparency**: Senders and receivers have limited visibility into payment status and deducted fees.
- **Operational & Compliance Overhead**: Complex relationships and pre-funding requirements for financial institutions.

Protocol Bank directly tackles these issues by offering a decentralized, efficient, and transparent alternative.

---

## ✨ Key Features

- **Dual Fiat and Cryptocurrency Support**: Seamlessly manage both traditional currencies and digital assets.
- **Global Payment Network Integration**: Direct integration with major clearing networks like CHIPS, CHAPS, Fedwire, TARGET2, and CIPS for rapid cross-border transactions.
- **Flow Payment (Stake)**: An innovative escrow and traceability system for VC/LP fund monitoring, ensuring that invested capital is spent on approved vendors and employees.
- **Automated DeFi Lending**: Leverage decentralized finance for automated lending and borrowing.
- **Automated Payment Splitting**: Businesses can automatically split payments for suppliers and vendors, optimizing supply chain finance.
- **Streaming Payments**: Enable real-time, continuous payments for freelancers and subscription services.
- **Facial Recognition Login & KYC Integration**: Enhanced security and streamlined user onboarding with advanced biometric authentication and regulatory compliance.
- **NFC Contactless Payments**: Modern and convenient payment options.
- **Solana & Ethereum Compatibility**: Primary deployment on Solana for speed and low fees, with cross-chain bridge capabilities and EIP protocol support for Ethereum compatibility.
- **Virtual Master Accounts with Real Sub-Accounts**: Optimize tax and financial management for individuals and businesses.

---

## 🔗 Smart Contracts

### 📜 Deployed Contracts

Protocol Bank utilizes smart contracts on the **Ethereum** blockchain for maximum compatibility and efficiency.

#### **Ethereum Contracts**

| Contract Name | Network | Address | Purpose |
|--------------|---------|---------|---------|
| **StakedPaymentEscrow** | Sepolia Testnet | `0x44a55360BaBc86d6443471Aa473E9Fa693037f04` | VC/LP fund escrow and traceability |
| **StreamPayment** | Sepolia Testnet | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Real-time streaming payments |
| **MockERC20 (USDC)** | Sepolia Testnet | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` | Test token for payments |

#### **StakedPaymentEscrow Contract Features**

- ✅ **Fund Escrow**: VCs/LPs can stake funds into a secure smart contract.
- ✅ **Whitelist Management**: Companies can only pay addresses approved by the staker.
- ✅ **Complete Traceability**: All transactions are recorded on-chain for full transparency.
- ✅ **Real-time Monitoring**: Stakers can monitor fund usage in real-time through the dashboard.
- ✅ **Role-based Access Control**: Different permissions for stakers (VC/LP) and companies.

**Key Functions**:
```solidity
// VC/LP creates an escrow pool and stakes funds
function createPool(address company) external payable returns (uint256)

// Company adds a supplier/employee to the whitelist for approval
function addToWhitelist(uint256 poolId, address recipient, string memory name, string memory category)

// VC/LP approves a whitelist entry
function approveWhitelist(uint256 poolId, address recipient)

// Company executes a payment to an approved recipient
function executePayment(uint256 poolId, address to, uint256 amount, string memory purpose)
```

#### **StreamPayment Contract Features**

- ✅ Real-time payment streaming
- ✅ Automated payment splitting to multiple suppliers
- ✅ Payment scheduling and automation
- ✅ Supplier registration and management
- ✅ Payment visualization and tracking

---

## 🎨 Features Showcase

### 🔒 Flow Payment (Stake)

A groundbreaking feature for venture capital and limited partners to monitor and control how their invested funds are used. By staking funds in an escrow smart contract, investors gain complete transparency and assurance that payments are only made to whitelisted and approved suppliers or employees. The system provides a real-time, interactive visualization of the payment flow, from the VC/LP to the company, and out to the final recipients.

### 💳 Payment Visualization
Interactive payment network graph showing real-time payment flows and supplier relationships.

### 🔄 Streaming Payments
Real-time payment streaming with automated distribution to multiple suppliers.

### 🌐 Global Network Integration
Direct integration with major payment networks (CHIPS, CHAPS, Fedwire, TARGET2, CIPS).

### 🔐 Advanced Security
- Facial recognition login
- Multi-factor authentication
- NFC contactless payments
- Device fingerprinting

---

## 🏗️ Technical Architecture

Protocol Bank is built with a robust and scalable architecture:

- **Frontend**: React.js with a minimalist UI design, utilizing `shadcn/ui`, `tailwindcss`, and `d3.js` for visualizations.
- **Blockchain**: 
  - **Ethereum**: Smart contracts for DeFi integration and cross-chain compatibility (Sepolia Testnet).
- **Web3 Integration**: `ethers.js` for wallet connection and smart contract interaction.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or compatible Web3 wallet

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Visit the application**
```
http://localhost:5173
```

---

## 📚 Documentation

- [Comprehensive Whitepaper (v2.0)](./docs/protocol_bank_complete_whitepaper.md)
- [Flow Payment (Stake) Feature Documentation](./flow_payment_stake_complete.md)

---

## 🌐 Live Demo

**Visit our live demo**: [https://www.protocolbanks.com/](https://www.protocolbanks.com/)

**Test Features**:
- ✅ Wallet connection (MetaMask)
- ✅ Flow Payment (Stake) - VC/LP fund monitoring
- ✅ Payment visualization
- ✅ Streaming payment creation
- ✅ Supplier management
- ✅ Payment splitting

---

## 👥 Team

**Team Name**: Richard

**Contact**:
- GitHub: [@everest-an](https://github.com/everest-an)
- Project Repository: [Protocol Bank](https://github.com/everest-an/Protocol-Bank)

---

## 📄 License

[License Information Here]

---

## 🏆 ETHShanghai 2025

This project is submitted to **ETHShanghai 2025 Hackathon**.

**Track**: DeFi × Infra

**Submission Date**: October 22, 2025

