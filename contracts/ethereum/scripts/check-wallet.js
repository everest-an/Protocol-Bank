const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Checking wallet and contract status...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Wallet Address:", deployer.address);

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 ETH Balance:", ethers.formatEther(ethBalance), "ETH");

  // Load deployment info
  const deploymentsDir = path.join(process.cwd(), "deployments");
  const files = fs.readdirSync(deploymentsDir);
  const sepoliaFile = files.find(f => f.startsWith("sepolia-"));

  if (!sepoliaFile) {
    console.log("❌ No Sepolia deployment found");
    return;
  }

  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, sepoliaFile), "utf8")
  );

  console.log("\n📋 Deployed Contracts:");
  console.log("  MockUSDC:", deployment.contracts.mockUSDC);
  console.log("  MockDAI:", deployment.contracts.mockDAI);
  console.log("  StreamPayment:", deployment.contracts.streamPayment);

  // Check USDC balance
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(deployment.contracts.mockUSDC);
  
  try {
    const usdcBalance = await usdc.balanceOf(deployer.address);
    const usdcSymbol = await usdc.symbol();
    const usdcDecimals = await usdc.decimals();
    console.log(`\n💵 ${usdcSymbol} Balance:`, ethers.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
  } catch (error) {
    console.log("\n⚠️ Could not fetch USDC balance:", error.message);
  }

  // Check DAI balance
  const dai = MockERC20.attach(deployment.contracts.mockDAI);
  
  try {
    const daiBalance = await dai.balanceOf(deployer.address);
    const daiSymbol = await dai.symbol();
    const daiDecimals = await dai.decimals();
    console.log(`💵 ${daiSymbol} Balance:`, ethers.formatUnits(daiBalance, daiDecimals), daiSymbol);
  } catch (error) {
    console.log("⚠️ Could not fetch DAI balance:", error.message);
  }

  // Check StreamPayment contract
  const StreamPayment = await ethers.getContractFactory("StreamPayment");
  const streamPayment = StreamPayment.attach(deployment.contracts.streamPayment);

  try {
    const nextStreamId = await streamPayment.nextStreamId();
    console.log("\n🌊 StreamPayment Contract:");
    console.log("  Next Stream ID:", nextStreamId.toString());
    console.log("  Total Streams Created:", (Number(nextStreamId) - 1).toString());
  } catch (error) {
    console.log("\n⚠️ Could not fetch StreamPayment info:", error.message);
  }

  console.log("\n✅ Wallet check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
