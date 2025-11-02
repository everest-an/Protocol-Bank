/**
 * Deploy Test Transactions to Sepolia
 * 部署测试交易到 Sepolia 测试网
 * 
 * This script:
 * 1. Registers test suppliers
 * 2. Creates test payment transactions
 * 3. Verifies the data can be read back
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const StreamPaymentABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/StreamPaymentABI.json'), 'utf-8')
);

// Configuration
const SEPOLIA_RPC_URL = process.env.VITE_ALCHEMY_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/N-UzzxYZbLPikS4Fc6pqC';
const CONTRACT_ADDRESS = '0x642B0c309358D083EE83748b4C22572aa28AebF7';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY; // Must be provided via environment variable

// Test suppliers data
const TEST_SUPPLIERS = [
  {
    name: 'Acme Corp',
    brand: 'Acme',
    category: 'Technology',
    profitMargin: 2360 // 23.6%
  },
  {
    name: 'Global Logistics',
    brand: 'GloLog',
    category: 'Logistics',
    profitMargin: 2870 // 28.7%
  },
  {
    name: 'Creative Studio',
    brand: 'Creative',
    category: 'Services',
    profitMargin: 3120 // 31.2%
  }
];

// Test payments data (using small amounts for testing)
const TEST_PAYMENTS = [
  {
    supplierIndex: 0, // Acme Corp
    amount: '0.01', // 0.01 ETH
    category: 'Software Development'
  },
  {
    supplierIndex: 1, // Global Logistics
    amount: '0.015', // 0.015 ETH
    category: 'Shipping Services'
  },
  {
    supplierIndex: 2, // Creative Studio
    amount: '0.02', // 0.02 ETH
    category: 'Design Services'
  },
  {
    supplierIndex: 0, // Acme Corp
    amount: '0.008', // 0.008 ETH
    category: 'Cloud Services'
  },
  {
    supplierIndex: 1, // Global Logistics
    amount: '0.012', // 0.012 ETH
    category: 'Freight Services'
  }
];

async function main() {
  console.log('🚀 Starting test transaction deployment to Sepolia...\n');

  // Check if private key is provided
  if (!PRIVATE_KEY) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-test-transactions.js');
    console.log('\nNote: Make sure the account has Sepolia ETH for gas fees');
    console.log('Get Sepolia ETH from: https://sepoliafaucet.com/');
    process.exit(1);
  }

  try {
    // Connect to Sepolia
    console.log('📡 Connecting to Sepolia...');
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, StreamPaymentABI, wallet);

    console.log(`✅ Connected to Sepolia`);
    console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`👤 Deployer: ${wallet.address}`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
      console.error('❌ Error: Deployer account has no ETH');
      console.log('Get Sepolia ETH from: https://sepoliafaucet.com/');
      process.exit(1);
    }

    // Step 1: Register suppliers
    console.log('📝 Step 1: Registering test suppliers...\n');
    const supplierAddresses = [];

    for (let i = 0; i < TEST_SUPPLIERS.length; i++) {
      const supplier = TEST_SUPPLIERS[i];
      console.log(`  ${i + 1}. Registering ${supplier.name}...`);

      try {
        // Create a new wallet for each supplier
        const supplierWallet = ethers.Wallet.createRandom();
        supplierAddresses.push(supplierWallet.address);

        const tx = await contract.registerSupplier(
          supplierWallet.address,
          supplier.name,
          supplier.brand,
          supplier.category,
          supplier.profitMargin
        );

        console.log(`     ⏳ Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`     ✅ Registered! Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`     📍 Supplier address: ${supplierWallet.address}\n`);
      } catch (error) {
        console.error(`     ❌ Failed to register ${supplier.name}:`, error.message);
        // Continue with next supplier
      }
    }

    console.log(`✅ Registered ${supplierAddresses.length} suppliers\n`);

    // Step 2: Create payments
    console.log('💸 Step 2: Creating test payments...\n');
    let successfulPayments = 0;

    for (let i = 0; i < TEST_PAYMENTS.length; i++) {
      const payment = TEST_PAYMENTS[i];
      const supplierAddress = supplierAddresses[payment.supplierIndex];

      if (!supplierAddress) {
        console.log(`  ${i + 1}. ⚠️  Skipping payment (supplier not registered)`);
        continue;
      }

      const supplier = TEST_SUPPLIERS[payment.supplierIndex];
      console.log(`  ${i + 1}. Creating payment to ${supplier.name} (${payment.amount} ETH)...`);

      try {
        const amountWei = ethers.parseEther(payment.amount);

        const tx = await contract.createPayment(
          supplierAddress,
          payment.category,
          { value: amountWei }
        );

        console.log(`     ⏳ Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`     ✅ Payment created! Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`     💰 Amount: ${payment.amount} ETH`);
        console.log(`     📋 Category: ${payment.category}\n`);

        successfulPayments++;
      } catch (error) {
        console.error(`     ❌ Failed to create payment:`, error.message);
        // Continue with next payment
      }
    }

    console.log(`✅ Created ${successfulPayments} payments\n`);

    // Step 3: Verify data
    console.log('🔍 Step 3: Verifying deployed data...\n');

    try {
      // Get supplier count
      const supplierCount = await contract.getActiveSupplierCount();
      console.log(`  📊 Active suppliers: ${supplierCount.toString()}`);

      // Get recent payments
      const recentPayments = await contract.getRecentPayments(10);
      console.log(`  📊 Recent payments: ${recentPayments.length}`);

      // Get all suppliers
      const allSuppliers = await contract.getAllSuppliers();
      console.log(`  📊 Total supplier addresses: ${allSuppliers.length}\n`);

      // Display supplier details
      console.log('📋 Supplier Details:\n');
      for (let i = 0; i < Math.min(allSuppliers.length, 5); i++) {
        const address = allSuppliers[i];
        const info = await contract.getSupplierInfo(address);
        console.log(`  ${i + 1}. ${info.name} (${info.brand})`);
        console.log(`     Address: ${address}`);
        console.log(`     Category: ${info.category}`);
        console.log(`     Total Received: ${ethers.formatEther(info.totalReceived)} ETH`);
        console.log(`     Profit Margin: ${(Number(info.profitMargin) / 100).toFixed(1)}%`);
        console.log(`     Active: ${info.isActive}\n`);
      }

      // Display payment details
      console.log('💳 Payment Details:\n');
      for (let i = 0; i < Math.min(recentPayments.length, 5); i++) {
        const payment = recentPayments[i];
        console.log(`  ${i + 1}. Payment #${payment.id.toString()}`);
        console.log(`     From: ${payment.from}`);
        console.log(`     To: ${payment.to}`);
        console.log(`     Amount: ${ethers.formatEther(payment.amount)} ETH`);
        console.log(`     Category: ${payment.category}`);
        console.log(`     Status: ${payment.status}\n`);
      }

      console.log('✅ Data verification complete!\n');

    } catch (error) {
      console.error('❌ Failed to verify data:', error.message);
    }

    // Summary
    console.log('📊 Deployment Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Suppliers registered: ${supplierAddresses.length}`);
    console.log(`✅ Payments created: ${successfulPayments}`);
    console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🌐 Network: Sepolia Testnet`);
    console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Test transaction deployment complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Visit https://www.protocolbanks.com');
    console.log('  2. Click "Exit Test Mode" to switch to Real Mode');
    console.log('  3. Verify that real blockchain data is displayed\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
