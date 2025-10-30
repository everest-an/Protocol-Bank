# Protocol Bank - Developer Quick Reference Guide

> **Purpose**: Quick reference for common development tasks  
> **Audience**: New developers joining the project  
> **Last Updated**: October 30, 2025

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Open browser
# Navigate to http://localhost:5173
```

---

## 📂 Project Structure

```
Protocol-Bank/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── PaymentNetwork/ # Payment network visualization
│   │   └── ...
│   ├── services/           # Business logic & API calls
│   │   ├── walletService.js
│   │   ├── paymentService.js
│   │   └── walletConnectService.js (⚠️ Currently disabled)
│   ├── utils/              # Utility functions
│   ├── pages/              # Page components
│   │   ├── Payments.jsx
│   │   ├── Suppliers.jsx
│   │   └── Analytics.jsx
│   └── main.jsx            # Application entry point
├── public/                 # Static assets
│   ├── sw.js              # Service Worker
│   ├── manifest.json      # PWA manifest
│   ├── robots.txt         # SEO: Search engine rules
│   ├── sitemap.xml        # SEO: Site map
│   └── og-image.png       # SEO: Social share image
├── docs/                   # Documentation
├── stream-payment/         # Smart contracts
│   ├── contracts/
│   ├── scripts/
│   └── test/
└── index.html             # HTML entry point
```

---

## 🛠️ Common Commands

### Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Format code
pnpm format
```

### Smart Contracts

```bash
# Navigate to contracts directory
cd stream-payment

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Stage changes
git add .

# Commit with conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"

# Push to GitHub
git push origin feature/your-feature-name

# Deployment is automatic via Vercel
```

---

## 🔑 Key Files & Their Purpose

### Frontend

| File | Purpose | Notes |
|------|---------|-------|
| `index.html` | HTML entry, SEO meta tags | Contains all SEO optimization |
| `src/main.jsx` | React app entry point | Initializes React, registers SW |
| `src/App.jsx` | Main app component | Routing, theme, i18n setup |
| `vite.config.js` | Vite configuration | Build settings, polyfills |
| `tailwind.config.js` | Tailwind CSS config | Theme colors, plugins |

### Smart Contracts

| File | Purpose | Network |
|------|---------|---------|
| `stream-payment/contracts/StakedPaymentEscrow.sol` | Main escrow contract | Sepolia |
| `stream-payment/scripts/deploy.js` | Deployment script | - |
| `stream-payment/test/StakedPaymentEscrow.test.js` | Contract tests | - |
| `hardhat.config.js` | Hardhat configuration | - |

### Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `.env` | Environment variables (not in repo) |
| `vercel.json` | Vercel deployment config |
| `public/manifest.json` | PWA configuration |

---

## 🌐 Environment Variables

Create a `.env` file in the project root:

```bash
# Blockchain RPC URLs
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Contract Addresses
VITE_ESCROW_CONTRACT_ADDRESS=0x44a55360BaBc86d6443471Aa473E9Fa693037f04

# API Keys (if needed)
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key

# For smart contract deployment (not in frontend .env)
PRIVATE_KEY=your_private_key_for_deployment
```

⚠️ **Never commit `.env` files to Git!**

---

## 🎨 UI Components

### Using shadcn/ui Components

```jsx
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter amount" />
      <Button>Submit</Button>
    </Card>
  )
}
```

### Theme System

```jsx
import { useTheme } from "@/components/theme-provider"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  )
}
```

### Internationalization

```jsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return <h1>{t('welcome.title')}</h1>
}
```

---

## 🔗 Web3 Integration

### Connecting Wallet

```jsx
import { connectMetaMask } from '@/services/walletService'

async function handleConnect() {
  try {
    const account = await connectMetaMask()
    console.log('Connected:', account)
  } catch (error) {
    console.error('Connection failed:', error)
  }
}
```

### Interacting with Smart Contracts

```jsx
import { ethers } from 'ethers'

// Get contract instance
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
)

// Call contract method
const tx = await contract.createPool(companyAddress, { value: amount })
await tx.wait()
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Blank Page in Production

**Symptom**: Website loads but shows blank page  
**Cause**: WalletConnect v1 compatibility issue  
**Solution**: Already fixed. See [PRODUCTION_FIX_SUMMARY.md](./PRODUCTION_FIX_SUMMARY.md)

### Issue 2: "global is not defined"

**Symptom**: Error in browser console  
**Cause**: Node.js globals not available in browser  
**Solution**: Already added polyfills in `index.html`

```html
<script>
  window.global = window;
  window.process = window.process || { env: {} };
  window.Buffer = window.Buffer || {};
</script>
```

### Issue 3: Module Not Found

**Symptom**: Import errors during build  
**Solution**: Check `vite.config.js` alias configuration

```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue 4: MetaMask Connection Fails

**Symptom**: Wallet connection throws error  
**Possible Causes**:
1. MetaMask not installed
2. Wrong network selected
3. User rejected connection

**Solution**:
```jsx
try {
  await connectMetaMask()
} catch (error) {
  if (error.code === 4001) {
    // User rejected
  } else if (error.code === -32002) {
    // Request pending
  }
}
```

---

## 📊 Key Features

### 1. Payment Network Visualization

**File**: `src/components/PaymentNetwork/PaymentNetwork.jsx`

- Real-time force-directed graph
- Interactive node dragging
- Zoom and pan controls
- Supplier count slider

### 2. Staked Payment Escrow

**Contract**: `0x44a55360BaBc86d6443471Aa473E9Fa693037f04` (Sepolia)

- Create escrow pools
- Whitelist recipients
- Execute payments
- Real-time tracking

### 3. Analytics Dashboard

**File**: `src/pages/Analytics.jsx`

- Payment trends chart
- Category distribution
- Top suppliers ranking
- Time range filters

### 4. Multi-language Support

**Supported Languages**:
- English (en)
- Chinese (zh)

**Add New Language**:
1. Create `src/locales/[lang]/translation.json`
2. Import in `src/i18n.js`
3. Add language selector option

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
*.key
```

### 2. Validate User Input

```jsx
// Always validate and sanitize
const amount = parseFloat(input)
if (isNaN(amount) || amount <= 0) {
  throw new Error('Invalid amount')
}
```

### 3. Use Safe Math

```solidity
// In smart contracts, use SafeMath or Solidity 0.8+
uint256 total = amount1 + amount2; // Safe in 0.8+
```

### 4. Check Contract Addresses

```jsx
// Validate Ethereum addresses
import { isAddress } from 'ethers'

if (!isAddress(address)) {
  throw new Error('Invalid address')
}
```

---

## 📈 Performance Tips

### 1. Code Splitting

```jsx
// Lazy load components
const Analytics = lazy(() => import('./pages/Analytics'))

<Suspense fallback={<Loading />}>
  <Analytics />
</Suspense>
```

### 2. Memoization

```jsx
// Prevent unnecessary re-renders
const MemoizedComponent = memo(({ data }) => {
  return <div>{data}</div>
})

// Memoize expensive calculations
const result = useMemo(() => {
  return expensiveCalculation(data)
}, [data])
```

### 3. Debounce User Input

```jsx
import { debounce } from 'lodash'

const handleSearch = debounce((query) => {
  // Perform search
}, 300)
```

---

## 🧪 Testing

### Frontend Tests

```bash
# Run tests (when implemented)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Smart Contract Tests

```bash
cd stream-payment
npx hardhat test

# Run specific test
npx hardhat test test/StakedPaymentEscrow.test.js

# Check coverage
npx hardhat coverage
```

---

## 📦 Deployment

### Automatic Deployment (Vercel)

1. Push to `main` branch
2. Vercel automatically builds and deploys
3. Check deployment status: https://vercel.com/everest-ans-projects/protocol-bank

### Manual Deployment

```bash
# Build production bundle
pnpm build

# Test production build locally
pnpm preview

# Deploy to Vercel manually
vercel --prod
```

### Smart Contract Deployment

```bash
cd stream-payment

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <ADDRESS>
```

---

## 📚 Important Documentation

### Must-Read for New Developers

1. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete doc index
2. **[README.md](./README.md)** - Project overview
3. **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
4. **[PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)** - Architecture analysis

### Before Making Changes

1. **[CODE_QUALITY_REPORT.md](./CODE_QUALITY_REPORT.md)** - Code standards
2. **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing requirements
3. **[SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)** - Security guidelines

### For Deployment

1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
2. **[PRODUCTION_FIX_SUMMARY.md](./PRODUCTION_FIX_SUMMARY.md)** - Known issues
3. **[SEO_OPTIMIZATION.md](./SEO_OPTIMIZATION.md)** - SEO guidelines

---

## 🤝 Contributing

### Commit Message Convention

```bash
# Format: <type>(<scope>): <subject>

feat(payments): add payment filtering
fix(wallet): resolve connection timeout
docs(readme): update installation steps
style(ui): improve button styling
refactor(api): simplify payment service
test(escrow): add escrow contract tests
chore(deps): update dependencies
```

### Pull Request Process

1. Create feature branch from `main`
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit PR with clear description
6. Wait for review and CI checks

---

## 🆘 Getting Help

### Resources

- **Documentation**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- **Issues**: https://github.com/everest-an/Protocol-Bank/issues
- **Discord**: Join our community server

### Common Questions

**Q: How do I add a new page?**  
A: Create component in `src/pages/`, add route in `src/App.jsx`

**Q: How do I modify the smart contract?**  
A: Edit `stream-payment/contracts/*.sol`, recompile, test, redeploy

**Q: How do I update SEO tags?**  
A: Modify `index.html` meta tags, see [SEO_OPTIMIZATION.md](./SEO_OPTIMIZATION.md)

**Q: WalletConnect not working?**  
A: WalletConnect v1 is currently disabled. Use MetaMask or browser wallets.

---

## 📞 Contact

- **GitHub**: https://github.com/everest-an/Protocol-Bank
- **Website**: https://www.protocolbanks.com
- **Discord**: https://discord.gg/protocolbank
- **Twitter**: @ProtocolBank

---

**Last Updated**: October 30, 2025  
**Maintained By**: Protocol Bank Development Team  
**Version**: 1.0.0
