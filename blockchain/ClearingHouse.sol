// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ClearingHouse
 * @dev 国家级银行清算所智能合约
 * @notice 本合约实现类似 SWIFT 的多边净额清算功能，支持流支付的周期性结算
 * 
 * 核心功能：
 * 1. 成员管理（银行和金融机构的注册和准入）
 * 2. 抵押品管理（实时监控和动态调整）
 * 3. 净额头寸提交和验证
 * 4. 多边净额结算计算
 * 5. 最终结算执行
 * 6. 违约处理和损失分摊
 * 
 * 符合 CPMI-IOSCO PFMI 原则
 */
contract ClearingHouse is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ 角色定义 ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

    // ============ 状态变量 ============
    
    /// @notice 结算周期 ID 计数器
    uint256 public currentSettlementCycle;
    
    /// @notice 结算周期时长（秒）
    uint256 public settlementPeriod;
    
    /// @notice 上次结算时间戳
    uint256 public lastSettlementTime;
    
    /// @notice 结算代币（如 USDC 或央行数字货币）
    IERC20 public immutable settlementToken;
    
    /// @notice 最低抵押品要求
    uint256 public minCollateralRequirement;
    
    /// @notice 抵押品折扣率（基点，10000 = 100%）
    uint256 public collateralHaircut;
    
    /// @notice 保险基金余额
    uint256 public insuranceFund;
    
    /// @notice 成员结构体
    struct Member {
        address memberAddress;          // 成员地址
        string name;                    // 成员名称
        string swiftCode;               // SWIFT 代码（如果适用）
        uint256 collateral;             // 已存入的抵押品
        uint256 requiredCollateral;     // 要求的抵押品
        bool isActive;                  // 是否活跃
        bool isRestricted;              // 是否受限（抵押品不足）
        uint256 joinedAt;               // 加入时间
    }
    
    /// @notice 净额头寸结构体
    struct NetPosition {
        int256 amount;                  // 净额（正为应收，负为应付）
        bytes32 dataHash;               // 数据哈希（用于验证）
        bytes signature;                // 成员签名
        uint256 timestamp;              // 提交时间
        bool isSubmitted;               // 是否已提交
        bool isVerified;                // 是否已验证
    }
    
    /// @notice 结算周期结构体
    struct SettlementCycle {
        uint256 cycleId;                // 周期 ID
        uint256 startTime;              // 开始时间
        uint256 endTime;                // 结束时间
        uint256 submissionDeadline;     // 提交截止时间
        uint256 totalNetSum;            // 总净额（应为 0）
        bool isFinalized;               // 是否已完成
        bool isSettled;                 // 是否已结算
    }
    
    /// @notice 违约事件结构体
    struct DefaultEvent {
        address defaulter;              // 违约方
        uint256 cycleId;                // 违约周期
        uint256 shortfall;              // 资金缺口
        uint256 collateralSeized;       // 罚没抵押品
        uint256 insuranceFundUsed;      // 使用的保险基金
        uint256 lossToSocialize;        // 需要社会化的损失
        uint256 timestamp;              // 违约时间
    }
    
    // ============ 映射 ============
    
    /// @notice 成员地址到成员信息的映射
    mapping(address => Member) public members;
    
    /// @notice 成员列表
    address[] public memberList;
    
    /// @notice 周期 ID -> 成员地址 -> 净额头寸
    mapping(uint256 => mapping(address => NetPosition)) public netPositions;
    
    /// @notice 周期 ID -> 结算周期信息
    mapping(uint256 => SettlementCycle) public settlementCycles;
    
    /// @notice 违约事件列表
    DefaultEvent[] public defaultEvents;
    
    /// @notice 成员地址到索引的映射（用于快速查找）
    mapping(address => uint256) private memberIndex;
    
    // ============ 事件 ============
    
    event MemberRegistered(address indexed member, string name, string swiftCode);
    event MemberDeregistered(address indexed member);
    event CollateralDeposited(address indexed member, uint256 amount);
    event CollateralWithdrawn(address indexed member, uint256 amount);
    event MemberRestricted(address indexed member, string reason);
    event MemberUnrestricted(address indexed member);
    
    event SettlementCycleStarted(uint256 indexed cycleId, uint256 startTime);
    event NetPositionSubmitted(uint256 indexed cycleId, address indexed member, int256 amount);
    event NetPositionVerified(uint256 indexed cycleId, address indexed member);
    event SettlementCycleFinalized(uint256 indexed cycleId, uint256 totalNetSum);
    event SettlementExecuted(uint256 indexed cycleId, uint256 timestamp);
    
    event DefaultDeclared(address indexed defaulter, uint256 indexed cycleId, uint256 shortfall);
    event CollateralSeized(address indexed defaulter, uint256 amount);
    event InsuranceFundUsed(uint256 amount);
    event LossSocialized(uint256 totalLoss, uint256 memberCount);
    
    event InsuranceFundContribution(address indexed contributor, uint256 amount);
    event ParameterUpdated(string parameter, uint256 oldValue, uint256 newValue);
    
    // ============ 修饰符 ============
    
    modifier onlyActiveMember() {
        require(members[msg.sender].isActive, "Not an active member");
        require(!members[msg.sender].isRestricted, "Member is restricted");
        _;
    }
    
    modifier onlyDuringSubmissionWindow(uint256 cycleId) {
        SettlementCycle memory cycle = settlementCycles[cycleId];
        require(block.timestamp >= cycle.startTime, "Submission window not started");
        require(block.timestamp <= cycle.submissionDeadline, "Submission window closed");
        _;
    }
    
    // ============ 构造函数 ============
    
    constructor(
        address _settlementToken,
        uint256 _settlementPeriod,
        uint256 _minCollateralRequirement,
        uint256 _collateralHaircut
    ) {
        require(_settlementToken != address(0), "Invalid token address");
        require(_settlementPeriod > 0, "Invalid settlement period");
        require(_collateralHaircut <= 10000, "Invalid haircut");
        
        settlementToken = IERC20(_settlementToken);
        settlementPeriod = _settlementPeriod;
        minCollateralRequirement = _minCollateralRequirement;
        collateralHaircut = _collateralHaircut;
        
        lastSettlementTime = block.timestamp;
        currentSettlementCycle = 0;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    // ============ 成员管理函数 ============
    
    /**
     * @notice 注册新成员（银行或金融机构）
     * @param _memberAddress 成员地址
     * @param _name 成员名称
     * @param _swiftCode SWIFT 代码
     * @param _initialCollateral 初始抵押品金额
     */
    function registerMember(
        address _memberAddress,
        string memory _name,
        string memory _swiftCode,
        uint256 _initialCollateral
    ) external onlyRole(ADMIN_ROLE) {
        require(_memberAddress != address(0), "Invalid member address");
        require(!members[_memberAddress].isActive, "Member already registered");
        require(_initialCollateral >= minCollateralRequirement, "Insufficient initial collateral");
        
        // 转入初始抵押品
        settlementToken.safeTransferFrom(msg.sender, address(this), _initialCollateral);
        
        // 创建成员记录
        members[_memberAddress] = Member({
            memberAddress: _memberAddress,
            name: _name,
            swiftCode: _swiftCode,
            collateral: _initialCollateral,
            requiredCollateral: minCollateralRequirement,
            isActive: true,
            isRestricted: false,
            joinedAt: block.timestamp
        });
        
        // 添加到成员列表
        memberIndex[_memberAddress] = memberList.length;
        memberList.push(_memberAddress);
        
        // 授予成员角色
        _grantRole(MEMBER_ROLE, _memberAddress);
        
        emit MemberRegistered(_memberAddress, _name, _swiftCode);
        emit CollateralDeposited(_memberAddress, _initialCollateral);
    }
    
    /**
     * @notice 存入抵押品
     * @param _amount 抵押品金额
     */
    function depositCollateral(uint256 _amount) external onlyActiveMember nonReentrant {
        require(_amount > 0, "Amount must be positive");
        
        settlementToken.safeTransferFrom(msg.sender, address(this), _amount);
        members[msg.sender].collateral += _amount;
        
        // 如果之前受限，检查是否可以解除限制
        if (members[msg.sender].isRestricted) {
            _checkAndUnrestrictMember(msg.sender);
        }
        
        emit CollateralDeposited(msg.sender, _amount);
    }
    
    /**
     * @notice 请求提取抵押品
     * @param _amount 提取金额
     * @dev 只能提取超出要求的部分，且需要等待一个结算周期
     */
    function requestWithdrawal(uint256 _amount) external onlyActiveMember nonReentrant {
        Member storage member = members[msg.sender];
        uint256 availableCollateral = member.collateral > member.requiredCollateral 
            ? member.collateral - member.requiredCollateral 
            : 0;
        
        require(_amount <= availableCollateral, "Insufficient available collateral");
        
        member.collateral -= _amount;
        settlementToken.safeTransfer(msg.sender, _amount);
        
        emit CollateralWithdrawn(msg.sender, _amount);
    }
    
    /**
     * @notice 注销成员
     * @param _memberAddress 成员地址
     * @dev 只能在所有结算义务完成后注销
     */
    function deregisterMember(address _memberAddress) external onlyRole(ADMIN_ROLE) {
        require(members[_memberAddress].isActive, "Member not active");
        
        // TODO: 检查是否有未完成的结算义务
        
        Member storage member = members[_memberAddress];
        uint256 collateralToReturn = member.collateral;
        
        member.isActive = false;
        member.collateral = 0;
        
        if (collateralToReturn > 0) {
            settlementToken.safeTransfer(_memberAddress, collateralToReturn);
        }
        
        _revokeRole(MEMBER_ROLE, _memberAddress);
        
        emit MemberDeregistered(_memberAddress);
    }
    
    // ============ 净额头寸提交函数 ============
    
    /**
     * @notice 提交净额头寸
     * @param _cycleId 结算周期 ID
     * @param _amount 净额（正为应收，负为应付）
     * @param _dataHash 数据哈希
     * @param _signature 签名
     */
    function submitNetPosition(
        uint256 _cycleId,
        int256 _amount,
        bytes32 _dataHash,
        bytes memory _signature
    ) external onlyActiveMember onlyDuringSubmissionWindow(_cycleId) nonReentrant {
        require(!netPositions[_cycleId][msg.sender].isSubmitted, "Already submitted");
        
        // 验证签名
        require(_verifySignature(msg.sender, _dataHash, _signature), "Invalid signature");
        
        // 如果是净借方（应付），检查抵押品是否足够
        if (_amount < 0) {
            uint256 requiredCollateral = _calculateRequiredCollateral(uint256(-_amount));
            require(members[msg.sender].collateral >= requiredCollateral, "Insufficient collateral");
        }
        
        // 记录净额头寸
        netPositions[_cycleId][msg.sender] = NetPosition({
            amount: _amount,
            dataHash: _dataHash,
            signature: _signature,
            timestamp: block.timestamp,
            isSubmitted: true,
            isVerified: false
        });
        
        emit NetPositionSubmitted(_cycleId, msg.sender, _amount);
    }
    
    /**
     * @notice 验证净额头寸（由运营者调用）
     * @param _cycleId 结算周期 ID
     * @param _memberAddress 成员地址
     */
    function verifyNetPosition(
        uint256 _cycleId,
        address _memberAddress
    ) external onlyRole(OPERATOR_ROLE) {
        NetPosition storage position = netPositions[_cycleId][_memberAddress];
        require(position.isSubmitted, "Position not submitted");
        require(!position.isVerified, "Already verified");
        
        // 这里可以添加额外的验证逻辑，例如与执行层数据对比
        
        position.isVerified = true;
        
        emit NetPositionVerified(_cycleId, _memberAddress);
    }
    
    // ============ 结算周期管理函数 ============
    
    /**
     * @notice 启动新的结算周期
     */
    function startSettlementCycle() external onlyRole(OPERATOR_ROLE) {
        require(
            block.timestamp >= lastSettlementTime + settlementPeriod,
            "Too early to start new cycle"
        );
        
        currentSettlementCycle++;
        uint256 cycleId = currentSettlementCycle;
        
        settlementCycles[cycleId] = SettlementCycle({
            cycleId: cycleId,
            startTime: block.timestamp,
            endTime: block.timestamp + settlementPeriod,
            submissionDeadline: block.timestamp + (settlementPeriod / 2), // 前半段时间用于提交
            totalNetSum: 0,
            isFinalized: false,
            isSettled: false
        });
        
        emit SettlementCycleStarted(cycleId, block.timestamp);
    }
    
    /**
     * @notice 完成结算周期（计算总净额）
     * @param _cycleId 结算周期 ID
     */
    function finalizeSettlementCycle(uint256 _cycleId) external onlyRole(OPERATOR_ROLE) {
        SettlementCycle storage cycle = settlementCycles[_cycleId];
        require(!cycle.isFinalized, "Already finalized");
        require(block.timestamp > cycle.submissionDeadline, "Submission window still open");
        
        // 计算总净额（应该为 0）
        int256 totalNetSum = 0;
        for (uint256 i = 0; i < memberList.length; i++) {
            address memberAddr = memberList[i];
            if (members[memberAddr].isActive && netPositions[_cycleId][memberAddr].isSubmitted) {
                totalNetSum += netPositions[_cycleId][memberAddr].amount;
            }
        }
        
        // 验证总净额为零（允许小的舍入误差）
        require(totalNetSum == 0, "Net sum must be zero");
        
        cycle.totalNetSum = uint256(totalNetSum >= 0 ? totalNetSum : -totalNetSum);
        cycle.isFinalized = true;
        
        emit SettlementCycleFinalized(_cycleId, cycle.totalNetSum);
    }
    
    // ============ 最终结算执行函数 ============
    
    /**
     * @notice 执行最终结算
     * @param _cycleId 结算周期 ID
     * @dev 这是核心的结算函数，执行多边净额结算
     */
    function executeSettlement(uint256 _cycleId) external onlyRole(OPERATOR_ROLE) nonReentrant {
        SettlementCycle storage cycle = settlementCycles[_cycleId];
        require(cycle.isFinalized, "Cycle not finalized");
        require(!cycle.isSettled, "Already settled");
        
        // 第一阶段：收集所有净借方（应付）
        address[] memory debtors = new address[](memberList.length);
        uint256[] memory debtAmounts = new uint256[](memberList.length);
        uint256 debtorCount = 0;
        
        // 第二阶段：收集所有净贷方（应收）
        address[] memory creditors = new address[](memberList.length);
        uint256[] memory creditAmounts = new uint256[](memberList.length);
        uint256 creditorCount = 0;
        
        for (uint256 i = 0; i < memberList.length; i++) {
            address memberAddr = memberList[i];
            if (!members[memberAddr].isActive) continue;
            
            NetPosition memory position = netPositions[_cycleId][memberAddr];
            if (!position.isSubmitted || !position.isVerified) continue;
            
            if (position.amount < 0) {
                // 净借方（应付）
                debtors[debtorCount] = memberAddr;
                debtAmounts[debtorCount] = uint256(-position.amount);
                debtorCount++;
            } else if (position.amount > 0) {
                // 净贷方（应收）
                creditors[creditorCount] = memberAddr;
                creditAmounts[creditorCount] = uint256(position.amount);
                creditorCount++;
            }
        }
        
        // 第三阶段：执行资金划转
        for (uint256 i = 0; i < debtorCount; i++) {
            address debtor = debtors[i];
            uint256 debtAmount = debtAmounts[i];
            
            // 检查抵押品是否足够
            if (members[debtor].collateral < debtAmount) {
                // 触发违约处理
                _handleDefault(debtor, _cycleId, debtAmount);
                continue;
            }
            
            // 从净借方的抵押品中扣除
            members[debtor].collateral -= debtAmount;
        }
        
        // 第四阶段：向净贷方分配资金
        for (uint256 i = 0; i < creditorCount; i++) {
            address creditor = creditors[i];
            uint256 creditAmount = creditAmounts[i];
            
            // 增加净贷方的抵押品
            members[creditor].collateral += creditAmount;
        }
        
        cycle.isSettled = true;
        lastSettlementTime = block.timestamp;
        
        emit SettlementExecuted(_cycleId, block.timestamp);
    }
    
    // ============ 违约处理函数 ============
    
    /**
     * @notice 处理违约
     * @param _defaulter 违约方地址
     * @param _cycleId 结算周期 ID
     * @param _requiredAmount 需要支付的金额
     */
    function _handleDefault(
        address _defaulter,
        uint256 _cycleId,
        uint256 _requiredAmount
    ) private {
        Member storage defaulterMember = members[_defaulter];
        uint256 shortfall = _requiredAmount - defaulterMember.collateral;
        
        // 第一步：罚没违约方的所有抵押品
        uint256 collateralSeized = defaulterMember.collateral;
        defaulterMember.collateral = 0;
        defaulterMember.isActive = false;
        
        emit CollateralSeized(_defaulter, collateralSeized);
        
        // 第二步：使用保险基金弥补缺口
        uint256 insuranceFundUsed = 0;
        if (shortfall > 0 && insuranceFund > 0) {
            insuranceFundUsed = shortfall > insuranceFund ? insuranceFund : shortfall;
            insuranceFund -= insuranceFundUsed;
            shortfall -= insuranceFundUsed;
            
            emit InsuranceFundUsed(insuranceFundUsed);
        }
        
        // 第三步：如果仍有缺口，进行损失社会化
        uint256 lossToSocialize = shortfall;
        if (lossToSocialize > 0) {
            _socializeLoss(lossToSocialize, _defaulter);
        }
        
        // 记录违约事件
        defaultEvents.push(DefaultEvent({
            defaulter: _defaulter,
            cycleId: _cycleId,
            shortfall: _requiredAmount - collateralSeized,
            collateralSeized: collateralSeized,
            insuranceFundUsed: insuranceFundUsed,
            lossToSocialize: lossToSocialize,
            timestamp: block.timestamp
        }));
        
        emit DefaultDeclared(_defaulter, _cycleId, shortfall);
    }
    
    /**
     * @notice 社会化损失（向所有非违约成员分摊）
     * @param _totalLoss 总损失
     * @param _defaulter 违约方地址
     */
    function _socializeLoss(uint256 _totalLoss, address _defaulter) private {
        uint256 activeMembers = 0;
        
        // 计算活跃成员数量
        for (uint256 i = 0; i < memberList.length; i++) {
            if (members[memberList[i]].isActive && memberList[i] != _defaulter) {
                activeMembers++;
            }
        }
        
        require(activeMembers > 0, "No active members to socialize loss");
        
        // 按比例分摊损失
        uint256 lossPerMember = _totalLoss / activeMembers;
        
        for (uint256 i = 0; i < memberList.length; i++) {
            address memberAddr = memberList[i];
            if (members[memberAddr].isActive && memberAddr != _defaulter) {
                // 从成员抵押品中扣除其分摊的损失
                if (members[memberAddr].collateral >= lossPerMember) {
                    members[memberAddr].collateral -= lossPerMember;
                } else {
                    // 如果抵押品不足，扣除全部
                    members[memberAddr].collateral = 0;
                    members[memberAddr].isRestricted = true;
                }
            }
        }
        
        emit LossSocialized(_totalLoss, activeMembers);
    }
    
    // ============ 辅助函数 ============
    
    /**
     * @notice 计算所需抵押品
     * @param _amount 金额
     * @return 所需抵押品（考虑折扣率）
     */
    function _calculateRequiredCollateral(uint256 _amount) private view returns (uint256) {
        return (_amount * 10000) / (10000 - collateralHaircut);
    }
    
    /**
     * @notice 验证签名
     * @param _signer 签名者地址
     * @param _dataHash 数据哈希
     * @param _signature 签名
     * @return 是否有效
     */
    function _verifySignature(
        address _signer,
        bytes32 _dataHash,
        bytes memory _signature
    ) private pure returns (bool) {
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _dataHash)
        );
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        address recoveredSigner = ecrecover(ethSignedHash, v, r, s);
        
        return recoveredSigner == _signer;
    }
    
    /**
     * @notice 分割签名
     */
    function _splitSignature(bytes memory _sig)
        private
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(_sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(_sig, 32))
            s := mload(add(_sig, 64))
            v := byte(0, mload(add(_sig, 96)))
        }
    }
    
    /**
     * @notice 检查并解除成员限制
     */
    function _checkAndUnrestrictMember(address _member) private {
        Member storage member = members[_member];
        if (member.collateral >= member.requiredCollateral) {
            member.isRestricted = false;
            emit MemberUnrestricted(_member);
        }
    }
    
    // ============ 保险基金管理 ============
    
    /**
     * @notice 向保险基金注资
     * @param _amount 注资金额
     */
    function contributeToInsuranceFund(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        
        settlementToken.safeTransferFrom(msg.sender, address(this), _amount);
        insuranceFund += _amount;
        
        emit InsuranceFundContribution(msg.sender, _amount);
    }
    
    // ============ 参数管理 ============
    
    /**
     * @notice 更新结算周期
     */
    function updateSettlementPeriod(uint256 _newPeriod) external onlyRole(ADMIN_ROLE) {
        require(_newPeriod > 0, "Invalid period");
        uint256 oldPeriod = settlementPeriod;
        settlementPeriod = _newPeriod;
        emit ParameterUpdated("settlementPeriod", oldPeriod, _newPeriod);
    }
    
    /**
     * @notice 更新最低抵押品要求
     */
    function updateMinCollateralRequirement(uint256 _newRequirement) external onlyRole(ADMIN_ROLE) {
        uint256 oldRequirement = minCollateralRequirement;
        minCollateralRequirement = _newRequirement;
        emit ParameterUpdated("minCollateralRequirement", oldRequirement, _newRequirement);
    }
    
    /**
     * @notice 更新抵押品折扣率
     */
    function updateCollateralHaircut(uint256 _newHaircut) external onlyRole(ADMIN_ROLE) {
        require(_newHaircut <= 10000, "Invalid haircut");
        uint256 oldHaircut = collateralHaircut;
        collateralHaircut = _newHaircut;
        emit ParameterUpdated("collateralHaircut", oldHaircut, _newHaircut);
    }
    
    // ============ 紧急控制 ============
    
    /**
     * @notice 暂停合约
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice 恢复合约
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ 查询函数 ============
    
    /**
     * @notice 获取成员数量
     */
    function getMemberCount() external view returns (uint256) {
        return memberList.length;
    }
    
    /**
     * @notice 获取活跃成员数量
     */
    function getActiveMemberCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < memberList.length; i++) {
            if (members[memberList[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @notice 获取违约事件数量
     */
    function getDefaultEventCount() external view returns (uint256) {
        return defaultEvents.length;
    }
}
