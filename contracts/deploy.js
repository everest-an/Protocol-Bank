// Hardhat deployment script for PaymentScheduler contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying PaymentScheduler contract...");

  // Get the contract factory
  const PaymentScheduler = await hre.ethers.getContractFactory("PaymentScheduler");
  
  // Deploy the contract
  const paymentScheduler = await PaymentScheduler.deploy();
  
  await paymentScheduler.deployed();

  console.log("PaymentScheduler deployed to:", paymentScheduler.address);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    address: paymentScheduler.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };
  
  fs.writeFileSync(
    './contracts/deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to contracts/deployment.json");
  
  // Verify contract on Etherscan (if not localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await paymentScheduler.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: paymentScheduler.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
