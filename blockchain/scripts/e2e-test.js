const { ethers } = require("hardhat");

/**
 * 端到端测试脚本
 * 模拟完整的清算流程
 */

async function main() {
  console.log("=".repeat(60));
  console.log("Protocol Bank - 端到端测试");
  console.log("=".repeat(60));
  console.log("");

  // 获取签名者
  const [deployer, nettingEngine, bank1, bank2, bank3] = await ethers.getSigners();

  console.log("测试账户:");
  console.log("  Deployer:", deployer.address);
  console.log("  Netting Engine:", nettingEngine.address);
  console.log("  Bank 1:", bank1.address);
  console.log("  Bank 2:", bank2.address);
  console.log("  Bank 3:", bank3.address);
  console.log("");

  // 1. 部署Mock USDC
  console.log("步骤 1: 部署Mock USDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("  ✅ Mock USDC deployed:", usdcAddress);
  console.log("");

  // 2. 部署ClearingHouse
  console.log("步骤 2: 部署ClearingHouse...");
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = await ClearingHouse.deploy(usdcAddress, nettingEngine.address);
  await clearingHouse.waitForDeployment();
  const clearingHouseAddress = await clearingHouse.getAddress();
  console.log("  ✅ ClearingHouse deployed:", clearingHouseAddress);
  console.log("");

  // 3. 给银行分配USDC
  console.log("步骤 3: 分配USDC给银行...");
  const mintAmount = ethers.parseUnits("100000", 6); // 100,000 USDC
  await usdc.mint(bank1.address, mintAmount);
  await usdc.mint(bank2.address, mintAmount);
  await usdc.mint(bank3.address, mintAmount);
  console.log("  ✅ 每家银行获得 100,000 USDC");
  console.log("");

  // 4. 注册参与者
  console.log("步骤 4: 注册参与者...");
  await clearingHouse.registerParticipant(bank1.address, "Bank A");
  await clearingHouse.registerParticipant(bank2.address, "Bank B");
  await clearingHouse.registerParticipant(bank3.address, "Bank C");
  console.log("  ✅ 3家银行已注册");
  console.log("");

  // 5. 存入抵押品
  console.log("步骤 5: 存入抵押品...");
  const depositAmount = ethers.parseUnits("10000", 6); // 10,000 USDC

  await usdc.connect(bank1).approve(clearingHouseAddress, ethers.MaxUint256);
  await clearingHouse.connect(bank1).deposit(depositAmount);

  await usdc.connect(bank2).approve(clearingHouseAddress, ethers.MaxUint256);
  await clearingHouse.connect(bank2).deposit(depositAmount);

  await usdc.connect(bank3).approve(clearingHouseAddress, ethers.MaxUint256);
  await clearingHouse.connect(bank3).deposit(depositAmount);

  console.log("  ✅ 每家银行存入 10,000 USDC 抵押品");
  console.log("");

  // 6. 模拟净额计算
  console.log("步骤 6: 提交净头寸...");
  const batchId = 1;
  const windowEnd = Math.floor(Date.now() / 1000);

  // 净头寸: Bank A +1000, Bank B -500, Bank C -500
  const positions = [
    { participant: bank1.address, amount: ethers.parseUnits("1000", 6) },
    { participant: bank2.address, amount: ethers.parseUnits("-500", 6) },
    { participant: bank3.address, amount: ethers.parseUnits("-500", 6) },
  ];

  // 计算签名
  const positionsHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address participant, int256 amount)[]"],
      [positions]
    )
  );

  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "uint256", "bytes32"],
    [batchId, windowEnd, positionsHash]
  );

  const signature = await nettingEngine.signMessage(ethers.getBytes(messageHash));

  // 提交净头寸
  const tx = await clearingHouse
    .connect(nettingEngine)
    .submitNetPositions(batchId, windowEnd, positions, signature);

  await tx.wait();
  console.log("  ✅ 净头寸已提交 (Batch #1)");
  console.log("    - Bank A: +1000 USDC");
  console.log("    - Bank B: -500 USDC");
  console.log("    - Bank C: -500 USDC");
  console.log("");

  // 7. 执行结算
  console.log("步骤 7: 执行结算...");
  const settleTx = await clearingHouse.connect(nettingEngine).settle(batchId, positions);
  await settleTx.wait();
  console.log("  ✅ 结算完成");
  console.log("");

  // 8. 查询结算后状态
  console.log("步骤 8: 查询结算后状态...");
  const bank1Info = await clearingHouse.getParticipant(bank1.address);
  const bank2Info = await clearingHouse.getParticipant(bank2.address);
  const bank3Info = await clearingHouse.getParticipant(bank3.address);

  console.log("  Bank A:");
  console.log("    - 抵押品:", ethers.formatUnits(bank1Info.collateral, 6), "USDC");
  console.log("    - 累计结算:", ethers.formatUnits(bank1Info.totalSettled, 6), "USDC");

  console.log("  Bank B:");
  console.log("    - 抵押品:", ethers.formatUnits(bank2Info.collateral, 6), "USDC");
  console.log("    - 累计结算:", ethers.formatUnits(bank2Info.totalSettled, 6), "USDC");

  console.log("  Bank C:");
  console.log("    - 抵押品:", ethers.formatUnits(bank3Info.collateral, 6), "USDC");
  console.log("    - 累计结算:", ethers.formatUnits(bank3Info.totalSettled, 6), "USDC");
  console.log("");

  // 9. 验证结果
  console.log("步骤 9: 验证结果...");
  const expectedBank1 = ethers.parseUnits("11000", 6); // 10000 + 1000
  const expectedBank2 = ethers.parseUnits("9500", 6); // 10000 - 500
  const expectedBank3 = ethers.parseUnits("9500", 6); // 10000 - 500

  if (
    bank1Info.collateral === expectedBank1 &&
    bank2Info.collateral === expectedBank2 &&
    bank3Info.collateral === expectedBank3
  ) {
    console.log("  ✅ 所有验证通过!");
  } else {
    console.log("  ❌ 验证失败!");
    console.log("    预期 Bank A:", ethers.formatUnits(expectedBank1, 6));
    console.log("    实际 Bank A:", ethers.formatUnits(bank1Info.collateral, 6));
    console.log("    预期 Bank B:", ethers.formatUnits(expectedBank2, 6));
    console.log("    实际 Bank B:", ethers.formatUnits(bank2Info.collateral, 6));
    console.log("    预期 Bank C:", ethers.formatUnits(expectedBank3, 6));
    console.log("    实际 Bank C:", ethers.formatUnits(bank3Info.collateral, 6));
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("测试完成!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
