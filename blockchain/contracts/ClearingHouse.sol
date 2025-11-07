// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ClearingHouse
 * @notice 实现多边净额结算的核心合约
 * @dev 通过链下净额计算和链上最终结算,降低交易成本并提高资本效率
 */
contract ClearingHouse is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ 数据结构 ============

    /// @notice 参与者信息
    struct Participant {
        string name;              // 机构名称
        bool isRegistered;        // 是否已注册
        uint256 collateral;       // 存入的抵押品余额
        uint256 totalSettled;     // 历史累计结算金额
    }

    /// @notice 结算周期的净头寸
    struct NetPosition {
        address participant;      // 参与者地址
        int256 amount;            // 净额 (正数为应收, 负数为应付)
    }

    /// @notice 结算批次
    struct SettlementBatch {
        uint256 windowEnd;        // 结算窗口结束时间
        bytes32 positionsHash;    // 净头寸数组的哈希值
        bool isSettled;           // 是否已结算
        uint256 settledAt;        // 结算时间戳
    }

    // ============ 状态变量 ============

    /// @notice 抵押品代币合约 (如 USDC)
    IERC20 public immutable collateralToken;

    /// @notice 净额引擎地址 (受信任的链下服务)
    address public nettingEngine;

    /// @notice 参与者映射
    mapping(address => Participant) public participants;

    /// @notice 参与者地址列表
    address[] public participantList;

    /// @notice 结算批次映射
    mapping(uint256 => SettlementBatch) public settlementBatches;

    /// @notice 下一个批次ID
    uint256 public nextBatchId = 1;

    /// @notice 最小抵押品要求
    uint256 public minCollateral = 1000 * 10**6; // 1000 USDC (假设6位小数)

    // ============ 事件 ============

    event ParticipantRegistered(address indexed participant, string name);
    event ParticipantRemoved(address indexed participant);
    event CollateralDeposited(address indexed participant, uint256 amount);
    event CollateralWithdrawn(address indexed participant, uint256 amount);
    event NetPositionsSubmitted(uint256 indexed batchId, uint256 windowEnd, bytes32 positionsHash);
    event SettlementCompleted(uint256 indexed batchId, uint256 timestamp);
    event NettingEngineUpdated(address indexed oldEngine, address indexed newEngine);

    // ============ 修饰符 ============

    modifier onlyNettingEngine() {
        require(msg.sender == nettingEngine, "ClearingHouse: caller is not netting engine");
        _;
    }

    modifier onlyRegistered() {
        require(participants[msg.sender].isRegistered, "ClearingHouse: caller is not registered");
        _;
    }

    // ============ 构造函数 ============

    /**
     * @notice 初始化清算所合约
     * @param _collateralToken 抵押品代币地址 (如 USDC)
     * @param _nettingEngine 净额引擎地址
     */
    constructor(address _collateralToken, address _nettingEngine) Ownable(msg.sender) {
        require(_collateralToken != address(0), "ClearingHouse: invalid collateral token");
        require(_nettingEngine != address(0), "ClearingHouse: invalid netting engine");

        collateralToken = IERC20(_collateralToken);
        nettingEngine = _nettingEngine;
    }

    // ============ 管理员函数 ============

    /**
     * @notice 设置或更换净额引擎地址
     * @param _engine 新的净额引擎地址
     */
    function setNettingEngine(address _engine) external onlyOwner {
        require(_engine != address(0), "ClearingHouse: invalid engine address");
        address oldEngine = nettingEngine;
        nettingEngine = _engine;
        emit NettingEngineUpdated(oldEngine, _engine);
    }

    /**
     * @notice 注册新的参与者
     * @param _participant 参与者地址
     * @param _name 机构名称
     */
    function registerParticipant(address _participant, string calldata _name) external onlyOwner {
        require(_participant != address(0), "ClearingHouse: invalid participant address");
        require(!participants[_participant].isRegistered, "ClearingHouse: already registered");
        require(bytes(_name).length > 0, "ClearingHouse: name cannot be empty");

        participants[_participant] = Participant({
            name: _name,
            isRegistered: true,
            collateral: 0,
            totalSettled: 0
        });

        participantList.push(_participant);
        emit ParticipantRegistered(_participant, _name);
    }

    /**
     * @notice 移除参与者
     * @param _participant 参与者地址
     */
    function removeParticipant(address _participant) external onlyOwner {
        require(participants[_participant].isRegistered, "ClearingHouse: not registered");
        require(participants[_participant].collateral == 0, "ClearingHouse: must withdraw collateral first");

        participants[_participant].isRegistered = false;
        emit ParticipantRemoved(_participant);
    }

    /**
     * @notice 设置最小抵押品要求
     * @param _minCollateral 新的最小抵押品金额
     */
    function setMinCollateral(uint256 _minCollateral) external onlyOwner {
        minCollateral = _minCollateral;
    }

    // ============ 参与者函数 ============

    /**
     * @notice 存入抵押品
     * @param _amount 存入金额
     */
    function deposit(uint256 _amount) external onlyRegistered nonReentrant {
        require(_amount > 0, "ClearingHouse: amount must be greater than 0");

        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        participants[msg.sender].collateral += _amount;

        emit CollateralDeposited(msg.sender, _amount);
    }

    /**
     * @notice 提取抵押品
     * @param _amount 提取金额
     */
    function withdraw(uint256 _amount) external onlyRegistered nonReentrant {
        require(_amount > 0, "ClearingHouse: amount must be greater than 0");
        Participant storage participant = participants[msg.sender];
        require(participant.collateral >= _amount, "ClearingHouse: insufficient collateral");

        // 提取后必须保持最小抵押品要求
        require(
            participant.collateral - _amount >= minCollateral,
            "ClearingHouse: below minimum collateral"
        );

        participant.collateral -= _amount;
        collateralToken.safeTransfer(msg.sender, _amount);

        emit CollateralWithdrawn(msg.sender, _amount);
    }

    // ============ 结算函数 ============

    /**
     * @notice 提交净头寸数据 (由净额引擎调用)
     * @param _batchId 批次ID
     * @param _windowEnd 结算窗口结束时间
     * @param _positions 净头寸数组
     * @param _signature 净额引擎的签名
     */
    function submitNetPositions(
        uint256 _batchId,
        uint256 _windowEnd,
        NetPosition[] calldata _positions,
        bytes calldata _signature
    ) external onlyNettingEngine {
        require(_batchId == nextBatchId, "ClearingHouse: invalid batch ID");
        require(_windowEnd <= block.timestamp, "ClearingHouse: window not ended");
        require(_positions.length > 0, "ClearingHouse: positions cannot be empty");

        // 验证净头寸总和为零
        int256 totalNet = 0;
        for (uint256 i = 0; i < _positions.length; i++) {
            require(
                participants[_positions[i].participant].isRegistered,
                "ClearingHouse: participant not registered"
            );
            totalNet += _positions[i].amount;
        }
        require(totalNet == 0, "ClearingHouse: net positions must sum to zero");

        // 计算positions的哈希值
        bytes32 positionsHash = keccak256(abi.encode(_positions));

        // 验证签名
        bytes32 messageHash = keccak256(abi.encodePacked(_batchId, _windowEnd, positionsHash));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ethSignedMessageHash.recover(_signature);
        require(signer == nettingEngine, "ClearingHouse: invalid signature");

        // 存储批次信息
        settlementBatches[_batchId] = SettlementBatch({
            windowEnd: _windowEnd,
            positionsHash: positionsHash,
            isSettled: false,
            settledAt: 0
        });

        nextBatchId++;
        emit NetPositionsSubmitted(_batchId, _windowEnd, positionsHash);
    }

    /**
     * @notice 执行结算 (任何人都可以调用)
     * @param _batchId 批次ID
     * @param _positions 净头寸数组 (必须与提交时的数据一致)
     */
    function settle(uint256 _batchId, NetPosition[] calldata _positions) external nonReentrant {
        SettlementBatch storage batch = settlementBatches[_batchId];
        require(batch.windowEnd > 0, "ClearingHouse: batch not found");
        require(!batch.isSettled, "ClearingHouse: already settled");

        // 验证positions与存储的哈希值一致
        bytes32 positionsHash = keccak256(abi.encode(_positions));
        require(positionsHash == batch.positionsHash, "ClearingHouse: positions mismatch");

        // 执行资金划转
        for (uint256 i = 0; i < _positions.length; i++) {
            NetPosition calldata pos = _positions[i];
            Participant storage participant = participants[pos.participant];

            if (pos.amount > 0) {
                // 应收: 增加抵押品
                participant.collateral += uint256(pos.amount);
            } else if (pos.amount < 0) {
                // 应付: 减少抵押品
                uint256 payableAmount = uint256(-pos.amount);
                require(participant.collateral >= payableAmount, "ClearingHouse: insufficient collateral");
                participant.collateral -= payableAmount;
            }

            participant.totalSettled += uint256(pos.amount > 0 ? pos.amount : -pos.amount);
        }

        batch.isSettled = true;
        batch.settledAt = block.timestamp;
        emit SettlementCompleted(_batchId, block.timestamp);
    }

    // ============ 查询函数 ============

    /**
     * @notice 获取参与者数量
     */
    function getParticipantCount() external view returns (uint256) {
        return participantList.length;
    }

    /**
     * @notice 获取参与者信息
     */
    function getParticipant(address _participant) external view returns (Participant memory) {
        return participants[_participant];
    }

    /**
     * @notice 获取批次信息
     */
    function getBatch(uint256 _batchId) external view returns (SettlementBatch memory) {
        return settlementBatches[_batchId];
    }

    /**
     * @notice 检查批次是否已结算
     */
    function isBatchSettled(uint256 _batchId) external view returns (bool) {
        return settlementBatches[_batchId].isSettled;
    }
}
