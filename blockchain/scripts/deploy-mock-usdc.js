const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying MockERC20 (USDC)...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);

  await mockUSDC.waitForDeployment();

  const usdcAddress = await mockUSDC.getAddress();
  console.log("MockERC20 (USDC) deployed to:", usdcAddress);

  // Mint initial supply to deployer
  const initialSupply = ethers.parseUnits("1000000", 6); // 1M USDC
  await mockUSDC.mint(deployer.address, initialSupply);
  console.log("Minted", ethers.formatUnits(initialSupply, 6), "USDC to deployer");

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractName: "MockERC20",
    address: usdcAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    initialSupply: initialSupply.toString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments", network.name);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, "MockUSDC.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);

  console.log("\n✅ Deployment completed!");
  console.log("\nNext steps:");
  console.log("1. Add this address to your .env file:");
  console.log(`   USDC_ADDRESS_SEPOLIA=${usdcAddress}`);
  console.log("2. Verify the contract on Etherscan:");
  console.log(`   npx hardhat verify --network ${network.name} ${usdcAddress} "Mock USDC" "USDC" 6`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
