// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PaymentScheduler
 * @dev Automated payment scheduling and execution system
 * @notice This contract allows users to create, manage, and execute automated payment flows
 */
contract PaymentScheduler is Ownable, ReentrancyGuard, Pausable {
    
    // Enums
    enum FlowStatus { Active, Paused, Completed, Cancelled }
    enum TriggerType { Time, Price, Event, Manual }
    
    // Structs
    struct PaymentFlow {
        uint256 id;
        address creator;
        address sender;
        address[] receivers;
        uint256[] amounts;
        TriggerType triggerType;
        uint256 triggerValue; // timestamp for Time, price for Price, etc.
        uint256 nextExecution;
        uint256 lastExecution;
        uint256 executionCount;
        FlowStatus status;
        string metadata; // JSON string containing flow configuration
        uint256 createdAt;
    }
    
    // State variables
    uint256 private _flowIdCounter;
    mapping(uint256 => PaymentFlow) public flows;
    mapping(address => uint256[]) public userFlows;
    
    // Events
    event FlowCreated(
        uint256 indexed flowId,
        address indexed creator,
        address sender,
        TriggerType triggerType
    );
    
    event FlowExecuted(
        uint256 indexed flowId,
        uint256 executionCount,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event FlowStatusChanged(
        uint256 indexed flowId,
        FlowStatus oldStatus,
        FlowStatus newStatus
    );
    
    event FlowUpdated(
        uint256 indexed flowId,
        uint256 nextExecution
    );
    
    // Modifiers
    modifier onlyFlowCreator(uint256 flowId) {
        require(flows[flowId].creator == msg.sender, "Not flow creator");
        _;
    }
    
    modifier flowExists(uint256 flowId) {
        require(flows[flowId].id != 0, "Flow does not exist");
        _;
    }
    
    /**
     * @dev Constructor
     */
    constructor() {
        _flowIdCounter = 1;
    }
    
    /**
     * @notice Create a new payment flow
     * @param sender Address that will send payments
     * @param receivers Array of receiver addresses
     * @param amounts Array of payment amounts (must match receivers length)
     * @param triggerType Type of trigger (Time, Price, Event, Manual)
     * @param triggerValue Trigger value (timestamp, price, etc.)
     * @param metadata JSON string containing flow configuration
     * @return flowId The ID of the created flow
     */
    function createFlow(
        address sender,
        address[] memory receivers,
        uint256[] memory amounts,
        TriggerType triggerType,
        uint256 triggerValue,
        string memory metadata
    ) external whenNotPaused returns (uint256) {
        require(receivers.length > 0, "No receivers specified");
        require(receivers.length == amounts.length, "Receivers and amounts length mismatch");
        require(sender != address(0), "Invalid sender address");
        
        uint256 flowId = _flowIdCounter++;
        
        PaymentFlow storage flow = flows[flowId];
        flow.id = flowId;
        flow.creator = msg.sender;
        flow.sender = sender;
        flow.receivers = receivers;
        flow.amounts = amounts;
        flow.triggerType = triggerType;
        flow.triggerValue = triggerValue;
        flow.nextExecution = triggerValue;
        flow.lastExecution = 0;
        flow.executionCount = 0;
        flow.status = FlowStatus.Active;
        flow.metadata = metadata;
        flow.createdAt = block.timestamp;
        
        userFlows[msg.sender].push(flowId);
        
        emit FlowCreated(flowId, msg.sender, sender, triggerType);
        
        return flowId;
    }
    
    /**
     * @notice Execute a payment flow
     * @param flowId The ID of the flow to execute
     */
    function executeFlow(uint256 flowId) 
        external 
        payable
        nonReentrant 
        whenNotPaused 
        flowExists(flowId) 
    {
        PaymentFlow storage flow = flows[flowId];
        
        require(flow.status == FlowStatus.Active, "Flow is not active");
        require(canExecute(flowId), "Flow cannot be executed yet");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < flow.amounts.length; i++) {
            totalAmount += flow.amounts[i];
        }
        
        require(msg.value >= totalAmount, "Insufficient payment");
        
        // Execute payments
        for (uint256 i = 0; i < flow.receivers.length; i++) {
            (bool success, ) = flow.receivers[i].call{value: flow.amounts[i]}("");
            require(success, "Payment failed");
        }
        
        // Update flow state
        flow.lastExecution = block.timestamp;
        flow.executionCount++;
        
        // Calculate next execution based on trigger type
        if (flow.triggerType == TriggerType.Time) {
            flow.nextExecution = flow.lastExecution + flow.triggerValue;
        }
        
        // Refund excess payment
        if (msg.value > totalAmount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalAmount}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit FlowExecuted(flowId, flow.executionCount, totalAmount, block.timestamp);
    }
    
    /**
     * @notice Check if a flow can be executed
     * @param flowId The ID of the flow to check
     * @return bool True if the flow can be executed
     */
    function canExecute(uint256 flowId) public view flowExists(flowId) returns (bool) {
        PaymentFlow storage flow = flows[flowId];
        
        if (flow.status != FlowStatus.Active) {
            return false;
        }
        
        if (flow.triggerType == TriggerType.Time) {
            return block.timestamp >= flow.nextExecution;
        }
        
        if (flow.triggerType == TriggerType.Manual) {
            return true;
        }
        
        // For Price and Event triggers, external oracles would validate
        return false;
    }
    
    /**
     * @notice Pause a flow
     * @param flowId The ID of the flow to pause
     */
    function pauseFlow(uint256 flowId) 
        external 
        onlyFlowCreator(flowId) 
        flowExists(flowId) 
    {
        PaymentFlow storage flow = flows[flowId];
        require(flow.status == FlowStatus.Active, "Flow is not active");
        
        FlowStatus oldStatus = flow.status;
        flow.status = FlowStatus.Paused;
        
        emit FlowStatusChanged(flowId, oldStatus, FlowStatus.Paused);
    }
    
    /**
     * @notice Resume a paused flow
     * @param flowId The ID of the flow to resume
     */
    function resumeFlow(uint256 flowId) 
        external 
        onlyFlowCreator(flowId) 
        flowExists(flowId) 
    {
        PaymentFlow storage flow = flows[flowId];
        require(flow.status == FlowStatus.Paused, "Flow is not paused");
        
        FlowStatus oldStatus = flow.status;
        flow.status = FlowStatus.Active;
        
        emit FlowStatusChanged(flowId, oldStatus, FlowStatus.Active);
    }
    
    /**
     * @notice Cancel a flow
     * @param flowId The ID of the flow to cancel
     */
    function cancelFlow(uint256 flowId) 
        external 
        onlyFlowCreator(flowId) 
        flowExists(flowId) 
    {
        PaymentFlow storage flow = flows[flowId];
        require(
            flow.status == FlowStatus.Active || flow.status == FlowStatus.Paused,
            "Flow cannot be cancelled"
        );
        
        FlowStatus oldStatus = flow.status;
        flow.status = FlowStatus.Cancelled;
        
        emit FlowStatusChanged(flowId, oldStatus, FlowStatus.Cancelled);
    }
    
    /**
     * @notice Get flow details
     * @param flowId The ID of the flow
     * @return PaymentFlow The flow details
     */
    function getFlow(uint256 flowId) 
        external 
        view 
        flowExists(flowId) 
        returns (PaymentFlow memory) 
    {
        return flows[flowId];
    }
    
    /**
     * @notice Get all flows created by a user
     * @param user The user address
     * @return uint256[] Array of flow IDs
     */
    function getUserFlows(address user) external view returns (uint256[] memory) {
        return userFlows[user];
    }
    
    /**
     * @notice Get total amount for a flow
     * @param flowId The ID of the flow
     * @return uint256 Total amount
     */
    function getFlowTotalAmount(uint256 flowId) 
        external 
        view 
        flowExists(flowId) 
        returns (uint256) 
    {
        PaymentFlow storage flow = flows[flowId];
        uint256 total = 0;
        for (uint256 i = 0; i < flow.amounts.length; i++) {
            total += flow.amounts[i];
        }
        return total;
    }
    
    /**
     * @notice Emergency pause all flows
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause all flows
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw contract balance (emergency only)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
