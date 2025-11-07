const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClearingHouse", function () {
  let clearingHouse;
  let mockUSDC;
  let owner;
  let nettingEngine;
  let participant1;
  let participant2;
  let participant3;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC
  const MIN_COLLATERAL = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, nettingEngine, participant1, participant2, participant3] = await ethers.getSigners();

    // 部署Mock USDC代币
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC;

    // 给参与者分配USDC
    await mockUSDC.mint(participant1.address, INITIAL_SUPPLY);
    await mockUSDC.mint(participant2.address, INITIAL_SUPPLY);
    await mockUSDC.mint(participant3.address, INITIAL_SUPPLY);

    // 部署ClearingHouse合约
    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    clearingHouse = await ClearingHouse.deploy(mockUSDC.target, nettingEngine.address);
    await clearingHouse;
  });

  describe("初始化", function () {
    it("应该正确设置抵押品代币和净额引擎", async function () {
      expect(await clearingHouse.collateralToken()).to.equal(mockUSDC.target);
      expect(await clearingHouse.nettingEngine()).to.equal(nettingEngine.address);
      expect(await clearingHouse.owner()).to.equal(owner.address);
    });

    it("应该设置正确的最小抵押品要求", async function () {
      expect(await clearingHouse.minCollateral()).to.equal(MIN_COLLATERAL);
    });
  });

  describe("参与者管理", function () {
    it("应该允许所有者注册参与者", async function () {
      await expect(clearingHouse.registerParticipant(participant1.address, "Bank A"))
        .to.emit(clearingHouse, "ParticipantRegistered")
        .withArgs(participant1.address, "Bank A");

      const participant = await clearingHouse.getParticipant(participant1.address);
      expect(participant.name).to.equal("Bank A");
      expect(participant.isRegistered).to.be.true;
      expect(participant.collateral).to.equal(0);
    });

    it("应该拒绝非所有者注册参与者", async function () {
      await expect(
        clearingHouse.connect(participant1).registerParticipant(participant2.address, "Bank B")
      ).to.be.revertedWithCustomError(clearingHouse, "OwnableUnauthorizedAccount");
    });

    it("应该拒绝重复注册", async function () {
      await clearingHouse.registerParticipant(participant1.address, "Bank A");
      await expect(
        clearingHouse.registerParticipant(participant1.address, "Bank A Duplicate")
      ).to.be.revertedWith("ClearingHouse: already registered");
    });

    it("应该允许所有者移除参与者", async function () {
      await clearingHouse.registerParticipant(participant1.address, "Bank A");
      await expect(clearingHouse.removeParticipant(participant1.address))
        .to.emit(clearingHouse, "ParticipantRemoved")
        .withArgs(participant1.address);

      const participant = await clearingHouse.getParticipant(participant1.address);
      expect(participant.isRegistered).to.be.false;
    });
  });

  describe("抵押品管理", function () {
    beforeEach(async function () {
      await clearingHouse.registerParticipant(participant1.address, "Bank A");
      await mockUSDC.connect(participant1).approve(clearingHouse.target, ethers.MaxUint256);
    });

    it("应该允许参与者存入抵押品", async function () {
      const depositAmount = ethers.parseUnits("5000", 6);
      await expect(clearingHouse.connect(participant1).deposit(depositAmount))
        .to.emit(clearingHouse, "CollateralDeposited")
        .withArgs(participant1.address, depositAmount);

      const participant = await clearingHouse.getParticipant(participant1.address);
      expect(participant.collateral).to.equal(depositAmount);
    });

    it("应该允许参与者提取抵押品", async function () {
      const depositAmount = ethers.parseUnits("5000", 6);
      await clearingHouse.connect(participant1).deposit(depositAmount);

      const withdrawAmount = ethers.parseUnits("2000", 6);
      await expect(clearingHouse.connect(participant1).withdraw(withdrawAmount))
        .to.emit(clearingHouse, "CollateralWithdrawn")
        .withArgs(participant1.address, withdrawAmount);

      const participant = await clearingHouse.getParticipant(participant1.address);
      expect(participant.collateral).to.equal(depositAmount - withdrawAmount);
    });

    it("应该拒绝提取超过余额的抵押品", async function () {
      const depositAmount = ethers.parseUnits("5000", 6);
      await clearingHouse.connect(participant1).deposit(depositAmount);

      const withdrawAmount = ethers.parseUnits("6000", 6);
      await expect(
        clearingHouse.connect(participant1).withdraw(withdrawAmount)
      ).to.be.revertedWith("ClearingHouse: insufficient collateral");
    });

    it("应该拒绝提取后低于最小抵押品要求", async function () {
      const depositAmount = ethers.parseUnits("2000", 6);
      await clearingHouse.connect(participant1).deposit(depositAmount);

      const withdrawAmount = ethers.parseUnits("1500", 6);
      await expect(
        clearingHouse.connect(participant1).withdraw(withdrawAmount)
      ).to.be.revertedWith("ClearingHouse: below minimum collateral");
    });
  });

  describe("净头寸提交与结算", function () {
    beforeEach(async function () {
      // 注册3个参与者
      await clearingHouse.registerParticipant(participant1.address, "Bank A");
      await clearingHouse.registerParticipant(participant2.address, "Bank B");
      await clearingHouse.registerParticipant(participant3.address, "Bank C");

      // 每个参与者存入抵押品
      const depositAmount = ethers.parseUnits("10000", 6);
      await mockUSDC.connect(participant1).approve(clearingHouse.target, ethers.MaxUint256);
      await mockUSDC.connect(participant2).approve(clearingHouse.target, ethers.MaxUint256);
      await mockUSDC.connect(participant3).approve(clearingHouse.target, ethers.MaxUint256);

      await clearingHouse.connect(participant1).deposit(depositAmount);
      await clearingHouse.connect(participant2).deposit(depositAmount);
      await clearingHouse.connect(participant3).deposit(depositAmount);
    });

    it("应该允许净额引擎提交净头寸", async function () {
      const batchId = 1;
      const windowEnd = Math.floor(Date.now() / 1000);
      const positions = [
        { participant: participant1.address, amount: ethers.parseUnits("1000", 6) },
        { participant: participant2.address, amount: ethers.parseUnits("-500", 6) },
        { participant: participant3.address, amount: ethers.parseUnits("-500", 6) }
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

      await expect(
        clearingHouse.connect(nettingEngine).submitNetPositions(batchId, windowEnd, positions, signature)
      )
        .to.emit(clearingHouse, "NetPositionsSubmitted")
        .withArgs(batchId, windowEnd, positionsHash);
    });

    it("应该拒绝非净额引擎提交净头寸", async function () {
      const batchId = 1;
      const windowEnd = Math.floor(Date.now() / 1000);
      const positions = [
        { participant: participant1.address, amount: ethers.parseUnits("1000", 6) },
        { participant: participant2.address, amount: ethers.parseUnits("-1000", 6) }
      ];
      const signature = "0x";

      await expect(
        clearingHouse.connect(participant1).submitNetPositions(batchId, windowEnd, positions, signature)
      ).to.be.revertedWith("ClearingHouse: caller is not netting engine");
    });

    it("应该拒绝净头寸总和不为零", async function () {
      const batchId = 1;
      const windowEnd = Math.floor(Date.now() / 1000);
      const positions = [
        { participant: participant1.address, amount: ethers.parseUnits("1000", 6) },
        { participant: participant2.address, amount: ethers.parseUnits("-500", 6) }
      ];

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

      await expect(
        clearingHouse.connect(nettingEngine).submitNetPositions(batchId, windowEnd, positions, signature)
      ).to.be.revertedWith("ClearingHouse: net positions must sum to zero");
    });

    it("应该成功执行结算", async function () {
      const batchId = 1;
      const windowEnd = Math.floor(Date.now() / 1000);
      const positions = [
        { participant: participant1.address, amount: ethers.parseUnits("1000", 6) },
        { participant: participant2.address, amount: ethers.parseUnits("-500", 6) },
        { participant: participant3.address, amount: ethers.parseUnits("-500", 6) }
      ];

      // 提交净头寸
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
      await clearingHouse.connect(nettingEngine).submitNetPositions(batchId, windowEnd, positions, signature);

      // 执行结算
      await expect(clearingHouse.settle(batchId, positions))
        .to.emit(clearingHouse, "SettlementCompleted")
        .withArgs(batchId, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      // 验证余额变化
      const p1 = await clearingHouse.getParticipant(participant1.address);
      const p2 = await clearingHouse.getParticipant(participant2.address);
      const p3 = await clearingHouse.getParticipant(participant3.address);

      expect(p1.collateral).to.equal(ethers.parseUnits("11000", 6));
      expect(p2.collateral).to.equal(ethers.parseUnits("9500", 6));
      expect(p3.collateral).to.equal(ethers.parseUnits("9500", 6));
    });

    it("应该拒绝重复结算", async function () {
      const batchId = 1;
      const windowEnd = Math.floor(Date.now() / 1000);
      const positions = [
        { participant: participant1.address, amount: ethers.parseUnits("1000", 6) },
        { participant: participant2.address, amount: ethers.parseUnits("-1000", 6) }
      ];

      // 提交并结算
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
      await clearingHouse.connect(nettingEngine).submitNetPositions(batchId, windowEnd, positions, signature);
      await clearingHouse.settle(batchId, positions);

      // 尝试重复结算
      await expect(clearingHouse.settle(batchId, positions)).to.be.revertedWith(
        "ClearingHouse: already settled"
      );
    });
  });
});
