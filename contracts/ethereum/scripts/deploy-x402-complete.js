const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy complete X402 Batch Settlement system
 * 
 * This script deploys:
 * 1. MockUSDC_EIP3009 (test token with EIP-3009 support)
 * 2. X402BatchSettlement (batch settlement contract)
 * 
 * Usage:
 * npx hardhat run scripts/deploy-x402-complete.js --network sepolia
 */

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying X402 Complete System to ${network}...\n`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.\n");
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
  const mintAmount = hre.ethers.parseUnits("10000", 6); // 10,000 USDC
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
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
  console.log("✅ Confirmed!\n");

  // Verify contracts on Etherscan (if not localhost)
  if (network !== "localhost" && network !== "hardhat") {
    console.log("🔍 Verifying contracts on Etherscan...\n");
    
    try {
      console.log("Verifying MockUSDC_EIP3009...");
      await hre.run("verify:verify", {
        address: mockUSDCAddress,
        constructorArguments: [],
      });
      console.log("✅ MockUSDC_EIP3009 verified!\n");
    } catch (error) {
      console.log("⚠️  MockUSDC verification failed:", error.message, "\n");
    }

    try {
      console.log("Verifying X402BatchSettlement...");
      await hre.run("verify:verify", {
        address: batchSettlementAddress,
        constructorArguments: [mockUSDCAddress],
      });
      console.log("✅ X402BatchSettlement verified!\n");
    } catch (error) {
      console.log("⚠️  X402BatchSettlement verification failed:", error.message, "\n");
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      mockUSDC: {
        address: mockUSDCAddress,
        name: "MockUSDC_EIP3009",
        symbol: "USDC",
        decimals: 6,
        eip3009: true
      },
      batchSettlement: {
        address: batchSettlementAddress,
        name: "X402BatchSettlement",
        tokenAddress: mockUSDCAddress
      }
    }
  };

  console.log("📋 Deployment Summary:");
  console.log("═".repeat(60));
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("═".repeat(60), "\n");

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `x402-complete-${network}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${filepath}\n`);

  // Generate frontend config
  const frontendConfig = {
    X402_BATCH_SETTLEMENT_ADDRESS: batchSettlementAddress,
    MOCK_USDC_ADDRESS: mockUSDCAddress,
    NETWORK: network,
    CHAIN_ID: deploymentInfo.chainId
  };

  const configFilepath = path.join(deploymentsDir, `x402-frontend-config-${network}.json`);
  fs.writeFileSync(configFilepath, JSON.stringify(frontendConfig, null, 2));
  console.log(`💾 Frontend config saved to: ${configFilepath}\n`);

  console.log("✨ Deployment complete!\n");
  console.log("Next steps:");
  console.log("1. Update frontend with contract addresses");
  console.log("2. Implement EIP-3009 signature generation");
  console.log("3. Test batch settlement flow\n");

  return { mockUSDC, batchSettlement, deploymentInfo };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
