const hre = require("hardhat");

/**
 * Deploy X402 Batch Settlement Contract
 * 
 * Usage:
 * npx hardhat run scripts/deploy-x402-batch-settlement.js --network baseSepolia
 */

// USDC addresses
const USDC_ADDRESSES = {
  // Base Sepolia Testnet
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  // Base Mainnet
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
};

async function main() {
  const network = hre.network.name;
  console.log(`Deploying X402BatchSettlement to ${network}...`);

  // Get USDC address for this network
  const usdcAddress = USDC_ADDRESSES[network];
  if (!usdcAddress) {
    throw new Error(`USDC address not configured for network: ${network}`);
  }

  console.log(`Using USDC address: ${usdcAddress}`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Check balance
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${hre.ethers.utils.formatEther(balance)} ETH`);

  // Deploy contract
  const X402BatchSettlement = await hre.ethers.getContractFactory("X402BatchSettlement");
  const contract = await X402BatchSettlement.deploy(usdcAddress);

  await contract.deployed();

  console.log(`✅ X402BatchSettlement deployed to: ${contract.address}`);
  console.log(`   Token: ${usdcAddress}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: ${network}`);

  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...");
  await contract.deployTransaction.wait(5);
  console.log("✅ Confirmed!");

  // Verify contract on Etherscan (if not localhost)
  if (network !== "localhost" && network !== "hardhat") {
    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: [usdcAddress],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network,
    contractAddress: contract.address,
    tokenAddress: usdcAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: contract.deployTransaction.hash,
    blockNumber: contract.deployTransaction.blockNumber
  };

  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `x402-batch-settlement-${network}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  return contract;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
