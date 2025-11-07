const hre = require("hardhat");

async function main() {
  console.log("开始部署 ClearingHouse 合约...\n");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("部署者余额:", hre.ethers.formatEther(balance), "ETH\n");

  // 配置参数
  const COLLATERAL_TOKEN_ADDRESS = process.env.USDC_ADDRESS || "0x..."; // USDC地址
  const NETTING_ENGINE_ADDRESS = process.env.NETTING_ENGINE_ADDRESS || deployer.address;

  console.log("配置参数:");
  console.log("- 抵押品代币 (USDC):", COLLATERAL_TOKEN_ADDRESS);
  console.log("- 净额引擎地址:", NETTING_ENGINE_ADDRESS);
  console.log("");

  // 部署 ClearingHouse
  console.log("正在部署 ClearingHouse...");
  const ClearingHouse = await hre.ethers.getContractFactory("ClearingHouse");
  const clearingHouse = await ClearingHouse.deploy(
    COLLATERAL_TOKEN_ADDRESS,
    NETTING_ENGINE_ADDRESS
  );

  await clearingHouse.waitForDeployment();
  const clearingHouseAddress = await clearingHouse.getAddress();
  console.log("✅ ClearingHouse 已部署到:", clearingHouseAddress);
  console.log("");

  // 等待几个区块确认
  console.log("等待区块确认...");
  // Ethers v6: deploymentTransaction() returns the transaction
  const deployTx = clearingHouse.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(5);
  }
  console.log("✅ 已确认\n");

  // 验证合约 (在Etherscan上)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("正在验证合约...");
    try {
      await hre.run("verify:verify", {
        address: clearingHouseAddress,
        constructorArguments: [COLLATERAL_TOKEN_ADDRESS, NETTING_ENGINE_ADDRESS],
      });
      console.log("✅ 合约验证成功\n");
    } catch (error) {
      console.log("⚠️ 合约验证失败:", error.message, "\n");
    }
  }

  // 输出部署信息
  console.log("=".repeat(60));
  console.log("部署完成!");
  console.log("=".repeat(60));
  console.log("ClearingHouse 地址:", clearingHouseAddress);
  console.log("网络:", hre.network.name);
  console.log("区块链浏览器:", getExplorerUrl(hre.network.name, clearingHouseAddress));
  console.log("=".repeat(60));

  // 保存部署信息到文件
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    clearingHouse: clearingHouseAddress,
    collateralToken: COLLATERAL_TOKEN_ADDRESS,
    nettingEngine: NETTING_ENGINE_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    `./deployments/${hre.network.name}-clearinghouse.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n部署信息已保存到: ./deployments/${hre.network.name}-clearinghouse.json`);
}

function getExplorerUrl(network, address) {
  const explorers = {
    mainnet: `https://etherscan.io/address/${address}`,
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    goerli: `https://goerli.etherscan.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    mumbai: `https://mumbai.polygonscan.com/address/${address}`,
  };
  return explorers[network] || "N/A";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
