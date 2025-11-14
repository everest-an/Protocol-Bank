const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy X402 Batch Settlement to Base Sepolia
 * 
 * This script deploys:
 * 1. MockUSDC_EIP3009 (test token with EIP-3009 support)
 * 2. X402BatchSettlement (batch settlement contract)
 * 
 * Usage:
 * npx hardhat run scripts/deploy-x402-base-sepolia.js --network baseSepolia
 */

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying X402 System to Base Sepolia...\n`);

  if (network !== "baseSepolia") {
    console.error("❌ Error: This script is for Base Sepolia network only!");
    console.error("   Please run with: --network baseSepolia");
    process.exit(1);
  }

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance < hre.ethers.parseEther("0.001")) {
    console.error("❌ Error: Insufficient balance for deployment!");
    console.error("   You need at least 0.001 ETH on Base Sepolia");
    console.error("   Get test ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    process.exit(1);
  }

  // Step 1: Deploy MockUSDC_EIP3009
  console.log("📦 Step 1: Deploying MockUSDC_EIP3009...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC_EIP3009");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();

  console.log(`✅ MockUSDC_EIP3009 deployed to: ${mockUSDCAddress}`);
  console.log(`   Name: Mock USDC`);
  console.log(`   Symbol: USDC`);
  console.log(`   Decimals: 6`);
  console.log(`   EIP-3009: Supported\n`);

  // Mint some tokens to deployer for testing
  console.log("💰 Minting test tokens to deployer...");
  const mintAmount = hre.ethers.parseUnits("100000", 6); // 100,000 USDC
  const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log(`✅ Minted ${hre.ethers.formatUnits(mintAmount, 6)} USDC to ${deployer.address}\n`);

  // Step 2: Deploy X402BatchSettlement
  console.log("📦 Step 2: Deploying X402BatchSettlement...");
  const X402BatchSettlement = await hre.ethers.getContractFactory("X402BatchSettlement");
  const batchSettlement = await X402BatchSettlement.deploy(mockUSDCAddress);
  await batchSettlement.waitForDeployment();
  const batchSettlementAddress = await batchSettlement.getAddress();

  console.log(`✅ X402BatchSettlement deployed to: ${batchSettlementAddress}`);
  console.log(`   Token: ${mockUSDCAddress}`);
  console.log(`   Deployer: ${deployer.address}\n`);

  // Wait for block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
  console.log("✅ Confirmed!\n");

  // Verify contracts on BaseScan
  console.log("🔍 Verifying contracts on BaseScan...\n");
  
  try {
    console.log("Verifying MockUSDC_EIP3009...");
    await hre.run("verify:verify", {
      address: mockUSDCAddress,
      constructorArguments: [],
    });
    console.log("✅ MockUSDC_EIP3009 verified!\n");
  } catch (error) {
    console.log("⚠️  MockUSDC verification failed:", error.message);
    console.log("   You can verify manually at: https://sepolia.basescan.org/address/" + mockUSDCAddress + "#code\n");
  }

  try {
    console.log("Verifying X402BatchSettlement...");
    await hre.run("verify:verify", {
      address: batchSettlementAddress,
      constructorArguments: [mockUSDCAddress],
    });
    console.log("✅ X402BatchSettlement verified!\n");
  } catch (error) {
    console.log("⚠️  X402BatchSettlement verification failed:", error.message);
    console.log("   You can verify manually at: https://sepolia.basescan.org/address/" + batchSettlementAddress + "#code\n");
  }

  // Save deployment info
  const deploymentInfo = {
    network: "Base Sepolia",
    chainId: "84532",
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      mockUSDC: {
        address: mockUSDCAddress,
        name: "MockUSDC_EIP3009",
        symbol: "USDC",
        decimals: 6,
        eip3009: true,
        explorer: `https://sepolia.basescan.org/address/${mockUSDCAddress}`
      },
      batchSettlement: {
        address: batchSettlementAddress,
        name: "X402BatchSettlement",
        tokenAddress: mockUSDCAddress,
        explorer: `https://sepolia.basescan.org/address/${batchSettlementAddress}`
      }
    },
    links: {
      baseScan: "https://sepolia.basescan.org",
      faucet: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
      docs: "https://docs.base.org"
    }
  };

  console.log("📋 Deployment Summary:");
  console.log("═".repeat(80));
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("═".repeat(80), "\n");

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `x402-base-sepolia.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${filepath}\n`);

  // Generate frontend config
  const frontendConfig = {
    // Base Sepolia Network
    NETWORK: "Base Sepolia",
    CHAIN_ID: 84532,
    RPC_URL: "https://sepolia.base.org",
    EXPLORER_URL: "https://sepolia.basescan.org",
    
    // Contracts
    X402_BATCH_SETTLEMENT_ADDRESS: batchSettlementAddress,
    MOCK_USDC_ADDRESS: mockUSDCAddress,
    
    // Real USDC on Base Sepolia (if available)
    REAL_USDC_ADDRESS: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    
    // Deployment info
    DEPLOYED_AT: deploymentInfo.deployedAt,
    DEPLOYER: deployer.address
  };

  const configFilepath = path.join(deploymentsDir, `x402-frontend-config-base-sepolia.json`);
  fs.writeFileSync(configFilepath, JSON.stringify(frontendConfig, null, 2));
  console.log(`💾 Frontend config saved to: ${configFilepath}\n`);

  // Update backend config
  const backendConfig = {
    networks: {
      baseSepolia: {
        chainId: 84532,
        rpcUrl: "https://sepolia.base.org",
        contracts: {
          x402BatchSettlement: batchSettlementAddress,
          mockUSDC: mockUSDCAddress,
          realUSDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        }
      }
    }
  };

  const backendConfigPath = path.join(__dirname, "../../../apps/backend/src/config/base-sepolia.json");
  const backendConfigDir = path.dirname(backendConfigPath);
  
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  
  fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
  console.log(`💾 Backend config saved to: ${backendConfigPath}\n`);

  console.log("✨ Deployment complete!\n");
  console.log("🎯 Next steps:");
  console.log("1. Update frontend .env with new contract addresses:");
  console.log(`   VITE_BASE_SEPOLIA_X402_ADDRESS=${batchSettlementAddress}`);
  console.log(`   VITE_BASE_SEPOLIA_USDC_ADDRESS=${mockUSDCAddress}`);
  console.log("");
  console.log("2. Test the deployment:");
  console.log("   - Visit BaseScan to verify contracts");
  console.log("   - Mint test USDC tokens");
  console.log("   - Test batch settlement");
  console.log("");
  console.log("3. Update documentation with deployment addresses\n");

  console.log("📊 Contract Addresses:");
  console.log(`   MockUSDC: ${mockUSDCAddress}`);
  console.log(`   X402BatchSettlement: ${batchSettlementAddress}`);
  console.log("");
  console.log("🔗 Explorer Links:");
  console.log(`   MockUSDC: https://sepolia.basescan.org/address/${mockUSDCAddress}`);
  console.log(`   X402BatchSettlement: https://sepolia.basescan.org/address/${batchSettlementAddress}`);
  console.log("");

  return { mockUSDC, batchSettlement, deploymentInfo };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
