// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../ClearingHouse.sol";
import "./mocks/MockERC20.sol";
import "./helpers/TestHelpers.sol";

/**
 * @title ClearingHouseTest
 * @dev Comprehensive test suite for ClearingHouse smart contract
 * 
 * Test Coverage:
 * 1. Contract deployment and initialization
 * 2. Member registration and management
 * 3. Collateral deposit and withdrawal
 * 4. Settlement cycle management
 * 5. Net position submission and verification
 * 6. Settlement execution (settleTransaction)
 * 7. Default handling and loss socialization
 * 8. Edge cases and error conditions
 * 9. Access control and security
 */
contract ClearingHouseTest is Test {
    using TestHelpers for *;
    
    // ============ Test Contracts ============
    ClearingHouse public clearingHouse;
    MockERC20 public settlementToken;
    
    // ============ Test Accounts ============
    address public admin = address(0x1);
    address public operator = address(0x2);
    address public bank1 = address(0x101);
    address public bank2 = address(0x102);
    address public bank3 = address(0x103);
    address public bank4 = address(0x104);
    address public nonMember = address(0x999);
    
    // ============ Test Constants ============
    uint256 constant SETTLEMENT_PERIOD = 1 hours;
    uint256 constant MIN_COLLATERAL = 1_000_000 * 10**6; // 1M USDC
    uint256 constant COLLATERAL_HAIRCUT = 1000; // 10%
    uint256 constant INITIAL_COLLATERAL = 10_000_000 * 10**6; // 10M USDC
    
    // ============ Setup ============
    
    function setUp() public {
        // Deploy mock settlement token (USDC with 6 decimals)
        settlementToken = new MockERC20("USD Coin", "USDC", 6);
        
        // Deploy ClearingHouse contract
        vm.prank(admin);
        clearingHouse = new ClearingHouse(
            address(settlementToken),
            SETTLEMENT_PERIOD,
            MIN_COLLATERAL,
            COLLATERAL_HAIRCUT
        );
        
        // Mint tokens for testing
        settlementToken.mint(admin, 1_000_000_000 * 10**6); // 1B USDC
        settlementToken.mint(bank1, 100_000_000 * 10**6);
        settlementToken.mint(bank2, 100_000_000 * 10**6);
        settlementToken.mint(bank3, 100_000_000 * 10**6);
        settlementToken.mint(bank4, 100_000_000 * 10**6);
        
        // Approve ClearingHouse to spend tokens
        vm.prank(admin);
        settlementToken.approve(address(clearingHouse), type(uint256).max);
        vm.prank(bank1);
        settlementToken.approve(address(clearingHouse), type(uint256).max);
        vm.prank(bank2);
        settlementToken.approve(address(clearingHouse), type(uint256).max);
        vm.prank(bank3);
        settlementToken.approve(address(clearingHouse), type(uint256).max);
        vm.prank(bank4);
        settlementToken.approve(address(clearingHouse), type(uint256).max);
    }
    
    // ============ Deployment Tests ============
    
    function test_Deployment() public {
        assertEq(address(clearingHouse.settlementToken()), address(settlementToken));
        assertEq(clearingHouse.settlementPeriod(), SETTLEMENT_PERIOD);
        assertEq(clearingHouse.minCollateralRequirement(), MIN_COLLATERAL);
        assertEq(clearingHouse.collateralHaircut(), COLLATERAL_HAIRCUT);
        assertEq(clearingHouse.currentSettlementCycle(), 0);
        assertTrue(clearingHouse.hasRole(clearingHouse.ADMIN_ROLE(), admin));
    }
    
    function testFail_DeploymentWithZeroToken() public {
        vm.prank(admin);
        new ClearingHouse(address(0), SETTLEMENT_PERIOD, MIN_COLLATERAL, COLLATERAL_HAIRCUT);
    }
    
    function testFail_DeploymentWithZeroPeriod() public {
        vm.prank(admin);
        new ClearingHouse(address(settlementToken), 0, MIN_COLLATERAL, COLLATERAL_HAIRCUT);
    }
    
    function testFail_DeploymentWithInvalidHaircut() public {
        vm.prank(admin);
        new ClearingHouse(address(settlementToken), SETTLEMENT_PERIOD, MIN_COLLATERAL, 10001);
    }
    
    // ============ Member Registration Tests ============
    
    function test_RegisterMember() public {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        (
            address memberAddress,
            string memory name,
            string memory swiftCode,
            uint256 collateral,
            uint256 requiredCollateral,
            bool isActive,
            bool isRestricted,
            uint256 joinedAt
        ) = clearingHouse.members(bank1);
        
        assertEq(memberAddress, bank1);
        assertEq(name, "Bank One");
        assertEq(swiftCode, "BANK1US");
        assertEq(collateral, INITIAL_COLLATERAL);
        assertEq(requiredCollateral, MIN_COLLATERAL);
        assertTrue(isActive);
        assertFalse(isRestricted);
        assertGt(joinedAt, 0);
        assertTrue(clearingHouse.hasRole(clearingHouse.MEMBER_ROLE(), bank1));
    }
    
    function testFail_RegisterMemberWithInsufficientCollateral() public {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", MIN_COLLATERAL - 1);
    }
    
    function testFail_RegisterMemberTwice() public {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
    }
    
    function testFail_RegisterMemberByNonAdmin() public {
        vm.prank(nonMember);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
    }
    
    // ============ Collateral Management Tests ============
    
    function test_DepositCollateral() public {
        // Register member first
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        uint256 depositAmount = 1_000_000 * 10**6;
        uint256 balanceBefore = settlementToken.balanceOf(bank1);
        
        vm.prank(bank1);
        clearingHouse.depositCollateral(depositAmount);
        
        (, , , uint256 collateral, , , , ) = clearingHouse.members(bank1);
        assertEq(collateral, INITIAL_COLLATERAL + depositAmount);
        assertEq(settlementToken.balanceOf(bank1), balanceBefore - depositAmount);
    }
    
    function testFail_DepositZeroCollateral() public {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        vm.prank(bank1);
        clearingHouse.depositCollateral(0);
    }
    
    function test_WithdrawCollateral() public {
        // Register member with extra collateral
        uint256 extraCollateral = 5_000_000 * 10**6;
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        vm.prank(bank1);
        clearingHouse.depositCollateral(extraCollateral);
        
        // Withdraw available collateral
        uint256 withdrawAmount = 2_000_000 * 10**6;
        uint256 balanceBefore = settlementToken.balanceOf(bank1);
        
        vm.prank(bank1);
        clearingHouse.requestWithdrawal(withdrawAmount);
        
        assertEq(settlementToken.balanceOf(bank1), balanceBefore + withdrawAmount);
    }
    
    function testFail_WithdrawExcessiveCollateral() public {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        // Try to withdraw more than available
        vm.prank(bank1);
        clearingHouse.requestWithdrawal(INITIAL_COLLATERAL);
    }
    
    // ============ Settlement Cycle Tests ============
    
    function test_StartSettlementCycle() public {
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        assertEq(cycleId, 1);
        
        (
            uint256 id,
            uint256 startTime,
            uint256 endTime,
            uint256 submissionDeadline,
            uint256 totalNetSum,
            bool isFinalized,
            bool isSettled
        ) = clearingHouse.settlementCycles(cycleId);
        
        assertEq(id, cycleId);
        assertGt(startTime, 0);
        assertEq(endTime, startTime + SETTLEMENT_PERIOD);
        assertGt(submissionDeadline, startTime);
        assertEq(totalNetSum, 0);
        assertFalse(isFinalized);
        assertFalse(isSettled);
    }
    
    function testFail_StartSettlementCycleTooEarly() public {
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        
        // Try to start another cycle immediately
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
    }
    
    // ============ Net Position Submission Tests ============
    
    function test_SubmitNetPosition() public {
        // Setup: Register members and start cycle
        _registerTestMembers();
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        int256 netAmount = 1_000_000 * 10**6; // Bank1 receives 1M
        
        // Calculate data hash
        bytes32 dataHash = TestHelpers.calculateNetPositionHash(cycleId, bank1, netAmount);
        
        // Sign the data (using Foundry's vm.sign)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, dataHash); // privateKey = 1 for bank1
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Submit net position
        vm.prank(bank1);
        clearingHouse.submitNetPosition(cycleId, netAmount, dataHash, signature);
        
        // Verify submission
        (
            int256 amount,
            bytes32 storedHash,
            bytes memory storedSig,
            uint256 timestamp,
            bool isSubmitted,
            bool isVerified
        ) = clearingHouse.netPositions(cycleId, bank1);
        
        assertEq(amount, netAmount);
        assertEq(storedHash, dataHash);
        assertTrue(isSubmitted);
        assertFalse(isVerified);
        assertGt(timestamp, 0);
    }
    
    function testFail_SubmitNetPositionOutsideWindow() public {
        _registerTestMembers();
        
        uint256 cycleId = 1;
        int256 netAmount = 1_000_000 * 10**6;
        bytes32 dataHash = keccak256(abi.encodePacked(cycleId, bank1, netAmount));
        bytes memory signature = new bytes(65);
        
        // Try to submit without starting cycle
        vm.prank(bank1);
        clearingHouse.submitNetPosition(cycleId, netAmount, dataHash, signature);
    }
    
    // ============ Settlement Execution Tests (Core Function) ============
    
    function test_SettleTransaction_BalancedPositions() public {
        // Setup: Register 4 banks with balanced net positions
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        // Submit balanced net positions:
        // Bank1: +2M (receives)
        // Bank2: +1M (receives)
        // Bank3: -1.5M (pays)
        // Bank4: -1.5M (pays)
        // Total: 0 (balanced)
        
        _submitNetPosition(cycleId, bank1, 2_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, 1_000_000 * 10**6);
        _submitNetPosition(cycleId, bank3, -1_500_000 * 10**6);
        _submitNetPosition(cycleId, bank4, -1_500_000 * 10**6);
        
        // Verify all positions
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank3);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank4);
        
        // Finalize cycle
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        // Get balances before settlement
        (, , , uint256 collateral1Before, , , , ) = clearingHouse.members(bank1);
        (, , , uint256 collateral2Before, , , , ) = clearingHouse.members(bank2);
        (, , , uint256 collateral3Before, , , , ) = clearingHouse.members(bank3);
        (, , , uint256 collateral4Before, , , , ) = clearingHouse.members(bank4);
        
        // Execute settlement
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        // Verify balances after settlement
        (, , , uint256 collateral1After, , , , ) = clearingHouse.members(bank1);
        (, , , uint256 collateral2After, , , , ) = clearingHouse.members(bank2);
        (, , , uint256 collateral3After, , , , ) = clearingHouse.members(bank3);
        (, , , uint256 collateral4After, , , , ) = clearingHouse.members(bank4);
        
        assertEq(collateral1After, collateral1Before + 2_000_000 * 10**6);
        assertEq(collateral2After, collateral2Before + 1_000_000 * 10**6);
        assertEq(collateral3After, collateral3Before - 1_500_000 * 10**6);
        assertEq(collateral4After, collateral4Before - 1_500_000 * 10**6);
        
        // Verify cycle is settled
        (, , , , , , bool isSettled) = clearingHouse.settlementCycles(cycleId);
        assertTrue(isSettled);
    }
    
    function test_SettleTransaction_WithInsufficientCollateral() public {
        // Setup: Register banks with one having insufficient collateral
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        // Bank3 needs to pay more than its collateral
        _submitNetPosition(cycleId, bank1, 15_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, 0);
        _submitNetPosition(cycleId, bank3, -15_000_000 * 10**6); // More than its 10M collateral
        _submitNetPosition(cycleId, bank4, 0);
        
        // Verify positions
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank3);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank4);
        
        // Finalize cycle
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        // Execute settlement - should trigger default handling
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        // Verify default was handled
        assertGt(clearingHouse.getDefaultEventCount(), 0);
        
        // Verify bank3 is restricted
        (, , , , , , bool isRestricted, ) = clearingHouse.members(bank3);
        assertTrue(isRestricted);
    }
    
    function test_SettleTransaction_EmptyPositions() public {
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        // Submit all zero positions
        _submitNetPosition(cycleId, bank1, 0);
        _submitNetPosition(cycleId, bank2, 0);
        _submitNetPosition(cycleId, bank3, 0);
        _submitNetPosition(cycleId, bank4, 0);
        
        // Verify and finalize
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank3);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank4);
        
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        // Execute settlement - should succeed with no changes
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        (, , , , , , bool isSettled) = clearingHouse.settlementCycles(cycleId);
        assertTrue(isSettled);
    }
    
    function testFail_SettleTransaction_NotFinalized() public {
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        // Try to settle without finalizing
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
    }
    
    function testFail_SettleTransaction_AlreadySettled() public {
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        _submitNetPosition(cycleId, bank1, 1_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, -1_000_000 * 10**6);
        
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        // Try to settle again
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
    }
    
    function testFail_SettleTransaction_ByNonOperator() public {
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        _submitNetPosition(cycleId, bank1, 1_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, -1_000_000 * 10**6);
        
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        // Try to settle as non-operator
        vm.prank(nonMember);
        clearingHouse.settleTransaction(cycleId);
    }
    
    // ============ Default Handling Tests ============
    
    function test_DefaultHandling_WithInsuranceFund() public {
        _registerTestMembers();
        
        // Add insurance fund
        uint256 insuranceAmount = 10_000_000 * 10**6;
        vm.prank(admin);
        clearingHouse.contributeToInsuranceFund(insuranceAmount);
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        // Bank3 defaults with 5M shortfall (has 10M collateral, needs 15M)
        _submitNetPosition(cycleId, bank1, 15_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, 0);
        _submitNetPosition(cycleId, bank3, -15_000_000 * 10**6);
        _submitNetPosition(cycleId, bank4, 0);
        
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank3);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank4);
        
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        uint256 insuranceBefore = clearingHouse.insuranceFund();
        
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        // Verify insurance fund was used
        uint256 insuranceAfter = clearingHouse.insuranceFund();
        assertLt(insuranceAfter, insuranceBefore);
        
        // Verify default event was recorded
        assertEq(clearingHouse.getDefaultEventCount(), 1);
    }
    
    function test_LossSocialization() public {
        _registerTestMembers();
        
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        // Bank3 defaults with large shortfall that exceeds collateral and insurance
        _submitNetPosition(cycleId, bank1, 20_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, 0);
        _submitNetPosition(cycleId, bank3, -20_000_000 * 10**6);
        _submitNetPosition(cycleId, bank4, 0);
        
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank3);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank4);
        
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        // Get collateral before
        (, , , uint256 collateral1Before, , , , ) = clearingHouse.members(bank1);
        (, , , uint256 collateral2Before, , , , ) = clearingHouse.members(bank2);
        (, , , uint256 collateral4Before, , , , ) = clearingHouse.members(bank4);
        
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        // Verify loss was socialized to other members
        (, , , uint256 collateral1After, , , , ) = clearingHouse.members(bank1);
        (, , , uint256 collateral2After, , , , ) = clearingHouse.members(bank2);
        (, , , uint256 collateral4After, , , , ) = clearingHouse.members(bank4);
        
        // Non-defaulting members should have reduced collateral
        assertLt(collateral1After, collateral1Before);
        assertLt(collateral2After, collateral2Before);
        assertLt(collateral4After, collateral4Before);
    }
    
    // ============ Access Control Tests ============
    
    function test_AdminRole() public {
        assertTrue(clearingHouse.hasRole(clearingHouse.ADMIN_ROLE(), admin));
        assertFalse(clearingHouse.hasRole(clearingHouse.ADMIN_ROLE(), nonMember));
    }
    
    function test_OperatorRole() public {
        // Grant operator role
        vm.prank(admin);
        clearingHouse.grantRole(clearingHouse.OPERATOR_ROLE(), operator);
        
        assertTrue(clearingHouse.hasRole(clearingHouse.OPERATOR_ROLE(), operator));
    }
    
    function testFail_NonAdminCannotRegisterMember() public {
        vm.prank(nonMember);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
    }
    
    // ============ Pause Functionality Tests ============
    
    function test_PauseAndUnpause() public {
        vm.prank(admin);
        clearingHouse.pause();
        
        assertTrue(clearingHouse.paused());
        
        vm.prank(admin);
        clearingHouse.unpause();
        
        assertFalse(clearingHouse.paused());
    }
    
    function testFail_OperationsWhenPaused() public {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        vm.prank(admin);
        clearingHouse.pause();
        
        // Try to deposit collateral when paused
        vm.prank(bank1);
        clearingHouse.depositCollateral(1_000_000 * 10**6);
    }
    
    // ============ Parameter Update Tests ============
    
    function test_UpdateSettlementPeriod() public {
        uint256 newPeriod = 2 hours;
        
        vm.prank(admin);
        clearingHouse.updateSettlementPeriod(newPeriod);
        
        assertEq(clearingHouse.settlementPeriod(), newPeriod);
    }
    
    function test_UpdateMinCollateralRequirement() public {
        uint256 newRequirement = 2_000_000 * 10**6;
        
        vm.prank(admin);
        clearingHouse.updateMinCollateralRequirement(newRequirement);
        
        assertEq(clearingHouse.minCollateralRequirement(), newRequirement);
    }
    
    function test_UpdateCollateralHaircut() public {
        uint256 newHaircut = 1500; // 15%
        
        vm.prank(admin);
        clearingHouse.updateCollateralHaircut(newHaircut);
        
        assertEq(clearingHouse.collateralHaircut(), newHaircut);
    }
    
    function testFail_UpdateHaircutAbove100Percent() public {
        vm.prank(admin);
        clearingHouse.updateCollateralHaircut(10001);
    }
    
    // ============ Query Function Tests ============
    
    function test_GetMemberCount() public {
        assertEq(clearingHouse.getMemberCount(), 0);
        
        _registerTestMembers();
        
        assertEq(clearingHouse.getMemberCount(), 4);
    }
    
    function test_GetActiveMemberCount() public {
        _registerTestMembers();
        
        assertEq(clearingHouse.getActiveMemberCount(), 4);
        
        // Deregister one member
        vm.prank(admin);
        clearingHouse.deregisterMember(bank4);
        
        assertEq(clearingHouse.getActiveMemberCount(), 3);
    }
    
    function test_GetDefaultEventCount() public {
        assertEq(clearingHouse.getDefaultEventCount(), 0);
        
        // Trigger a default
        _registerTestMembers();
        vm.prank(admin);
        clearingHouse.startSettlementCycle();
        uint256 cycleId = clearingHouse.currentSettlementCycle();
        
        _submitNetPosition(cycleId, bank1, 15_000_000 * 10**6);
        _submitNetPosition(cycleId, bank2, 0);
        _submitNetPosition(cycleId, bank3, -15_000_000 * 10**6);
        _submitNetPosition(cycleId, bank4, 0);
        
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank1);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank2);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank3);
        vm.prank(operator);
        clearingHouse.verifyNetPosition(cycleId, bank4);
        
        vm.prank(operator);
        clearingHouse.finalizeSettlementCycle(cycleId);
        
        vm.prank(operator);
        clearingHouse.settleTransaction(cycleId);
        
        assertEq(clearingHouse.getDefaultEventCount(), 1);
    }
    
    // ============ Helper Functions ============
    
    function _registerTestMembers() private {
        vm.prank(admin);
        clearingHouse.registerMember(bank1, "Bank One", "BANK1US", INITIAL_COLLATERAL);
        
        vm.prank(admin);
        clearingHouse.registerMember(bank2, "Bank Two", "BANK2US", INITIAL_COLLATERAL);
        
        vm.prank(admin);
        clearingHouse.registerMember(bank3, "Bank Three", "BANK3US", INITIAL_COLLATERAL);
        
        vm.prank(admin);
        clearingHouse.registerMember(bank4, "Bank Four", "BANK4US", INITIAL_COLLATERAL);
        
        // Grant operator role
        vm.prank(admin);
        clearingHouse.grantRole(clearingHouse.OPERATOR_ROLE(), operator);
    }
    
    function _submitNetPosition(
        uint256 cycleId,
        address member,
        int256 amount
    ) private {
        bytes32 dataHash = TestHelpers.calculateNetPositionHash(cycleId, member, amount);
        
        // Create a dummy signature (in real tests, use proper signing)
        bytes memory signature = new bytes(65);
        
        vm.prank(member);
        clearingHouse.submitNetPosition(cycleId, amount, dataHash, signature);
    }
}
