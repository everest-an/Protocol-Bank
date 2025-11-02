# Protocol Bank - Architecture Overview

> **Purpose**: High-level technical architecture documentation  
> **Audience**: Developers, architects, technical stakeholders  
> **Last Updated**: October 30, 2025

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Performance Considerations](#performance-considerations)

---

## 🌐 System Overview

Protocol Bank is a **decentralized cross-border payment platform** built on blockchain technology, designed to replace traditional correspondent banking systems like SWIFT.

### Core Mission

Provide instant, low-cost, transparent cross-border payments by integrating blockchain technology with global payment systems (CHIPS, CHAPS, Fedwire, TARGET2, CIPS).

### Key Characteristics

- **Decentralized**: No single point of control
- **Transparent**: All transactions on-chain and auditable
- **Fast**: Real-time settlement (vs 2-5 days traditional)
- **Low-cost**: 90% lower fees than traditional banking
- **Interoperable**: Bridges fiat and crypto ecosystems

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **Vite** | 5.4.11 | Build tool & dev server |
| **TailwindCSS** | 3.4.15 | Styling framework |
| **shadcn/ui** | Latest | Component library |
| **ethers.js** | 6.13.4 | Web3 integration |
| **D3.js** | 7.9.0 | Data visualization |
| **i18next** | 23.16.4 | Internationalization |
| **Recharts** | 2.15.0 | Charts & graphs |

### Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.20 | Smart contract language |
| **Hardhat** | 2.22.17 | Development environment |
| **OpenZeppelin** | 5.0.0 | Security libraries |
| **Ethers.js** | 6.x | Contract interaction |

### Blockchain Networks

| Network | Purpose | Status |
|---------|---------|--------|
| **Ethereum Mainnet** | Layer 1 - Final settlement layer | Planned |
| **Ethereum Sepolia** | Testnet deployment | ✅ Active |
| **Layer 2 Clearing Network** | Off-chain netting settlement | In Development |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting & CI/CD |
| **GitHub** | Code repository & version control |
| **Infura/Alchemy** | Blockchain RPC provider |
| **Etherscan** | Contract verification & explorer |

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (React SPA, PWA, Mobile-Responsive UI)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Business Logic, State Management, API Integration)    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  (Wallet Service, Payment Service, Analytics Service)   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Blockchain Layer                       │
│  (Smart Contracts, Web3 Provider, Transaction Manager)  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                   │
│  (Ethereum L1, L2 Clearing Network, IPFS, Oracles)      │
└─────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contract Architecture

### Core Contracts

#### 1. StakedPaymentEscrow

**Purpose**: Escrow system for venture capital fund management

**Address**: `0x44a55360BaBc86d6443471Aa473E9Fa693037f04` (Sepolia)

**Key Features**:
- Create escrow pools for portfolio companies
- Whitelist-based payment authorization
- Real-time payment tracking
- Complete transparency for investors

**Contract Structure**:

```solidity
contract StakedPaymentEscrow {
    // Data structures
    struct Pool {
        address staker;        // VC/LP address
        address company;       // Portfolio company
        uint256 totalStaked;   // Total funds in escrow
        uint256 totalSpent;    // Total funds spent
        bool active;           // Pool status
    }
    
    struct Recipient {
        string name;           // Recipient name
        string category;       // Business category
        bool approved;         // Approval status
    }
    
    struct Payment {
        address recipient;     // Payment recipient
        uint256 amount;        // Payment amount
        uint256 timestamp;     // Payment time
        string purpose;        // Payment purpose
    }
    
    // Core functions
    function createPool(address _company) external payable;
    function proposeRecipient(uint256 poolId, address recipient, string name, string category) external;
    function approveRecipient(uint256 poolId, address recipient) external;
    function executePayment(uint256 poolId, address recipient, uint256 amount, string purpose) external;
    function getPoolInfo(uint256 poolId) external view returns (Pool);
    function getPaymentHistory(uint256 poolId) external view returns (Payment[]);
}
```

#### 2. Registry Contract (Planned)

**Purpose**: Maintain registry of participating financial institutions

**Features**:
- Institution registration
- Public key management
- Metadata storage
- Access control

#### 3. Settlement Contract (Planned)

**Purpose**: Handle clearing and settlement of transactions

**Features**:
- Atomic swaps
- Automated market makers (AMMs)
- Streaming payments
- Multi-currency support

#### 4. Treasury Contract (Planned)

**Purpose**: Manage protocol treasury

**Features**:
- Revenue collection
- Fund allocation
- Governance integration
- Emergency backstop

### Smart Contract Security

**Security Measures**:
- ✅ OpenZeppelin security libraries
- ✅ Reentrancy guards
- ✅ Access control (Ownable)
- ✅ SafeMath (Solidity 0.8+)
- ✅ Event logging for transparency
- ✅ Third-party security audits

**Audit Status**:
- Internal audit: ✅ Complete
- External audit: 🔄 In progress

---

## 💻 Frontend Architecture

### Component Hierarchy

```
App.jsx (Root)
├── ThemeProvider
├── I18nProvider
├── Web3Provider
└── Router
    ├── Layout
    │   ├── Header
    │   │   ├── Logo
    │   │   ├── Navigation
    │   │   ├── WalletButton
    │   │   ├── LanguageSelector
    │   │   └── ThemeToggle
    │   ├── Main
    │   │   └── [Page Components]
    │   └── Footer
    └── Routes
        ├── /payments → Payments.jsx
        │   ├── PaymentNetwork (D3 visualization)
        │   ├── PaymentTable
        │   └── PaymentFilters
        ├── /suppliers → Suppliers.jsx
        │   ├── SupplierList
        │   ├── SupplierCard
        │   └── RegisterSupplierModal
        └── /analytics → Analytics.jsx
            ├── MetricsCards
            ├── CategoryChart
            ├── TrendChart
            └── TopSuppliersTable
```

### State Management

**Approach**: React Context + Local State

```jsx
// Global State (Context)
- ThemeContext: Dark/light mode
- LanguageContext: i18n locale
- Web3Context: Wallet connection, account, network

// Local State (useState/useReducer)
- Component-specific UI state
- Form inputs
- Loading states
```

### Data Flow Pattern

```
User Action
    ↓
Event Handler
    ↓
Service Layer (API/Web3 call)
    ↓
State Update
    ↓
Component Re-render
```

### Key Services

#### 1. walletService.js

**Purpose**: Wallet connection and management

```javascript
// Functions
- connectMetaMask()
- disconnectWallet()
- getAccount()
- getBalance()
- switchNetwork()
```

#### 2. paymentService.js

**Purpose**: Payment operations

```javascript
// Functions
- createPayment()
- getPaymentHistory()
- getPaymentDetails()
- filterPayments()
```

#### 3. escrowService.js

**Purpose**: Escrow contract interactions

```javascript
// Functions
- createPool()
- proposeRecipient()
- approveRecipient()
- executePayment()
- getPoolInfo()
```

#### 4. analyticsService.js

**Purpose**: Analytics and reporting

```javascript
// Functions
- getPaymentTrends()
- getCategoryDistribution()
- getTopSuppliers()
- calculateMetrics()
```

---

## 🔄 Data Flow

### Payment Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1. Initiate Payment
     ↓
┌──────────────────┐
│  Frontend (UI)   │
└────┬─────────────┘
     │ 2. Validate Input
     ↓
┌──────────────────┐
│ Wallet Service   │
└────┬─────────────┘
     │ 3. Sign Transaction
     ↓
┌──────────────────┐
│ Smart Contract   │
└────┬─────────────┘
     │ 4. Execute on-chain
     ↓
┌──────────────────┐
│   Blockchain     │
└────┬─────────────┘
     │ 5. Emit Event
     ↓
┌──────────────────┐
│  Frontend (UI)   │
└────┬─────────────┘
     │ 6. Update UI
     ↓
┌──────────┐
│   User   │
└──────────┘
```

### Escrow Flow (Flow Payment)

```
1. VC/LP creates escrow pool
   └─> Deposits funds to smart contract
   
2. Company proposes recipient
   └─> Adds to whitelist (pending approval)
   
3. VC/LP approves recipient
   └─> Recipient added to approved whitelist
   
4. Company executes payment
   └─> Funds transferred from escrow to recipient
   
5. Real-time visualization
   └─> Payment flow displayed in force-directed graph
```

---

## 🔒 Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────┐
│         Wallet-Based Auth                │
│  (No passwords, cryptographic signing)   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Smart Contract ACL               │
│  (On-chain access control lists)         │
└─────────────────────────────────────────┘
```

**Levels**:
1. **Public**: Anyone can view
2. **Connected**: Wallet connected users
3. **Authorized**: Specific addresses (e.g., pool staker)
4. **Admin**: Contract owner (multi-sig)

### Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Frontend Input Validation     │
│  - Type checking                         │
│  - Range validation                      │
│  - Address validation                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Layer 2: Smart Contract Validation     │
│  - require() statements                  │
│  - Access control modifiers              │
│  - Reentrancy guards                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Layer 3: Blockchain Consensus          │
│  - Network validation                    │
│  - Immutable execution                   │
└─────────────────────────────────────────┘
```

### Key Security Features

1. **Multi-signature Wallets**: Critical operations require multiple approvals
2. **Hardware Security Modules (HSM)**: Private key protection
3. **Rate Limiting**: Prevent spam and DoS attacks
4. **Event Logging**: Complete audit trail
5. **Emergency Pause**: Circuit breaker for critical issues
6. **Upgradability**: Proxy pattern for contract upgrades (with governance)

---

## 🚀 Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────┐
│                   Users                          │
│  (Web Browsers, Mobile Devices)                 │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│              Vercel CDN                          │
│  (Global Edge Network, HTTPS, Caching)          │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         Protocol Bank Frontend                   │
│  (React SPA, Service Worker, PWA)               │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         Blockchain RPC Provider                  │
│  (Infura, Alchemy, QuickNode)                   │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         Ethereum Network                         │
│  (Smart Contracts, Transactions)                │
└─────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
Developer Push
     ↓
GitHub Repository
     ↓
Vercel Build
     ├─> Install dependencies (pnpm install)
     ├─> Run linter (pnpm lint)
     ├─> Build production (pnpm build)
     └─> Deploy to CDN
     ↓
Production (www.protocolbanks.com)
```

**Deployment Triggers**:
- Push to `main` branch → Production deployment
- Push to feature branches → Preview deployments
- Pull requests → Automatic preview links

### Environment Configuration

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Development** | localhost:5173 | Local development |
| **Preview** | *.vercel.app | PR previews |
| **Production** | www.protocolbanks.com | Live site |

---

## ⚡ Performance Considerations

### Frontend Optimization

**Bundle Size Optimization**:
- ✅ Code splitting by route
- ✅ Lazy loading components
- ✅ Tree shaking unused code
- ✅ Minification & compression
- ✅ Asset optimization (images, fonts)

**Current Bundle Sizes**:
- Main JS: 537.96 kB (144.92 kB gzipped)
- CSS: 146.72 kB (22.65 kB gzipped)
- Total: ~685 kB (~168 kB gzipped)

**Loading Performance**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s

**Optimization Techniques**:
1. **React.memo**: Prevent unnecessary re-renders
2. **useMemo/useCallback**: Memoize expensive calculations
3. **Virtual scrolling**: For large lists
4. **Debouncing**: For search inputs
5. **Service Worker**: Offline caching

### Smart Contract Gas Optimization

**Techniques**:
- Use `uint256` instead of smaller uints (gas-efficient)
- Pack struct variables efficiently
- Use events instead of storage for logs
- Batch operations when possible
- Optimize loop iterations

**Gas Costs** (Sepolia):
- Create Pool: ~150,000 gas
- Propose Recipient: ~80,000 gas
- Approve Recipient: ~50,000 gas
- Execute Payment: ~100,000 gas

---

## 🔮 Future Architecture

### Planned Enhancements

1. **Multi-chain Support**
   - Ethereum Mainnet (Layer 1 final settlement)
   - Layer 2 Clearing Network (off-chain netting)
   - Optional L2 integration (Arbitrum/Optimism/Polygon)
   - Cross-chain bridges

2. **Backend Services**
   - Node.js API server
   - PostgreSQL database
   - Redis caching layer
   - WebSocket for real-time updates

3. **Advanced Features**
   - AI-powered fraud detection
   - Automated compliance checks
   - Dynamic fee optimization
   - Liquidity aggregation

4. **Scalability**
   - Layer 2 solutions (Optimism, Arbitrum)
   - State channels for micro-payments
   - Sharding for horizontal scaling

---

## 📊 Architecture Diagrams

### High-Level System Architecture

```
                    ┌─────────────┐
                    │   Users     │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ↓              ↓              ↓
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Web    │   │  Mobile  │   │   API    │
    │ Browser  │   │   App    │   │ Clients  │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                ┌───────▼────────┐
                │  Protocol Bank │
                │    Frontend    │
                └───────┬────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Ethereum L1  │ │ L2 Clearing  │ │   Payment    │
│  Contracts   │ │   Network    │ │   Gateways   │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                ┌───────▼────────┐
                │   Global       │
                │   Payment      │
                │   Networks     │
                └────────────────┘
```

---

## 📚 Related Documentation

- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)** - Quick reference guide
- **[PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)** - Detailed project analysis
- **[SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)** - Security audit findings
- **[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)** - Performance guide

---

**Last Updated**: October 30, 2025  
**Version**: 1.0.0  
**Maintained By**: Protocol Bank Development Team
