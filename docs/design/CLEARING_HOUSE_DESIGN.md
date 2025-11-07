# ClearingHouse.sol - 详细设计文档

**版本**: 1.0  
**日期**: 2025-11-08  
**作者**: Manus AI

---

## 1. 概述

### 1.1. 目标

`ClearingHouse.sol` 是 Protocol Bank 网络的核心智能合约,旨在实现**多边净额结算 (Multilateral Net Settlement)**。通过在链下对大量的支付指令进行净额计算,然后在链上执行一次性的最终结算,该合约将大幅降低交易成本、减少网络拥堵并提高资本效率。

### 1.2. 核心概念

- **参与者 (Participant)**: 经过批准加入网络的金融机构(如银行)。
- **结算周期 (Settlement Window)**: 一个预设的时间段(如24小时),在此期间内累积交易指令。
- **净额引擎 (Netting Engine)**: 一个受信任的链下服务,负责在每个结算周期结束时计算所有参与者的净头寸。
- **链上结算 (On-Chain Settlement)**: 净额引擎将计算结果提交到`ClearingHouse.sol`,合约验证并执行最终的资金划转。

---

## 2. 系统架构与工作流程

### 2.1. 架构图

```mermaid
graph TD
    A[参与者 A] -- 支付指令 --> B(净额引擎);
    C[参与者 C] -- 支付指令 --> B;
    D[参与者 D] -- 支付指令 --> B;

    subgraph 链下 (Off-Chain)
        B -- 1. 累积交易 --> E{结算周期结束};
        E -- 2. 计算净头寸 --> B;
    end

    subgraph 链上 (On-Chain)
        B -- "3. 提交净头寸\n(submitNetPositions)" --> F(ClearingHouse.sol);
        F -- "4. 验证签名\n& 数据一致性" --> F;
        F -- "5. 执行结算\n(settle)" --> G{更新参与者余额};
    end

    G -- "6. 资金划转" --> A;
    G -- "" --> C;
    G -- "" --> D;
```

### 2.2. 工作流程

1. **注册**: 金融机构作为参与者在`ClearingHouse.sol`中注册,并存入一定数量的抵押品(如USDC)。
2. **链下交易**: 在一个结算周期内,参与者之间通过安全的链下消息通道交换大量的支付指令。
3. **净额计算**: 结算周期结束时,净额引擎收集所有支付指令,计算出每个参与者最终应付或应收的净额。
4. **提交头寸**: 净额引擎将所有参与者的净头寸数据和签名提交到`ClearingHouse.sol`的`submitNetPositions`函数。
5. **验证**: 合约验证净额引擎的签名,并确保所有净头寸的总和为零(借方总额 == 贷方总额)。
6. **结算**: 验证通过后,任何人都可以调用`settle`函数,合约将根据净头寸数据,在链上一次性完成所有参与者抵押品账户之间的资金划转。

---

## 3. 数据结构

```solidity
// 参与者信息
struct Participant {
    address addr;         // 参与者的钱包地址
    string name;          // 机构名称
    bool isRegistered;    // 是否已注册
    uint256 collateral;   // 存入的抵押品余额
}

// 结算周期的净头寸
struct NetPosition {
    address participant;  // 参与者地址
    int256 amount;        // 净额 (正数为应收, 负数为应付)
}

// 结算批次
struct SettlementBatch {
    uint256 id;                 // 批次ID
    uint256 windowEnd;          // 结算窗口结束时间
    NetPosition[] positions;    // 该批次的所有净头寸
    bytes signature;            // 净额引擎的签名
    bool isSettled;             // 是否已结算
}

// 核心状态变量
mapping(address => Participant) public participants;
mapping(uint256 => SettlementBatch) public settlementBatches;
address public nettingEngineAddress; // 净额引擎的地址
address public owner;                // 合约所有者
IERC20 public collateralToken;      // 抵押品代币合约 (USDC)
```

---

## 4. 核心函数接口

### 4.1. 管理员函数

- `setNettingEngine(address _engine)`: 设置或更换净额引擎地址 (仅限所有者)。
- `registerParticipant(address _participant, string calldata _name)`: 注册新的参与者 (仅限所有者)。
- `removeParticipant(address _participant)`: 移除参与者 (仅限所有者)。

### 4.2. 参与者函数

- `deposit(uint256 _amount)`: 存入抵押品。
- `withdraw(uint256 _amount)`: 提取抵押品 (不能低于应付净额)。

### 4.3. 结算函数

- `submitNetPositions(uint256 _batchId, uint256 _windowEnd, NetPosition[] calldata _positions, bytes calldata _signature)`: 由净额引擎调用,提交一个结算批次的净头寸。
  - **验证**: 检查`msg.sender`是否为净额引擎,验证签名,确保净头寸总和为零。
- `settle(uint256 _batchId)`: 任何人都可以调用,执行一个已提交且未结算的批次。
  - **执行**: 遍历`positions`,使用`collateralToken.transfer()`在参与者之间划转资金。

---

## 5. 安全设计

- **访问控制**: 使用`Ownable`模式,关键的管理函数只能由合约所有者调用。`submitNetPositions`只能由受信任的净额引擎调用。
- **签名验证**: 净额引擎提交数据时必须附带ECDSA签名,合约在链上验证签名以确保数据来源可信。
- **零和验证**: `submitNetPositions`函数必须检查所有净头寸的总和是否为零,防止资金凭空产生或消失。
- **防重入**: 使用OpenZeppelin的`ReentrancyGuard`防止在资金划转过程中发生重入攻击。
- **抵押品充足性**: 参与者提取抵押品时,合约会检查其是否有未结算的应付款项,确保系统始终有足够的偿付能力。

---

## 6. 事件 (Events)

- `ParticipantRegistered(address indexed participant, string name)`
- `CollateralDeposited(address indexed participant, uint256 amount)`
- `CollateralWithdrawn(address indexed participant, uint256 amount)`
- `NetPositionsSubmitted(uint256 indexed batchId, uint256 windowEnd)`
- `SettlementCompleted(uint256 indexed batchId)`

---

## 7. 待办事项

- **Gas费优化**: 对`settle`函数中的循环进行优化,考虑使用Merkle Tree等技术来降低批量提交和验证的Gas成本。
- **预言机集成**: 集成Chainlink等预言机,用于在处理多币种抵押品时获取可靠的汇率。
- **治理机制**: 未来考虑引入去中心化治理机制,通过投票来管理参与者和净额引擎的变更。
