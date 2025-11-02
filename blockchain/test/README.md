# ClearingHouse Smart Contract Test Suite

## Overview

This directory contains a comprehensive test suite for the `ClearingHouse.sol` smart contract, which implements a national-level bank clearing system with streaming payment and SWIFT-like multilateral net settlement functionality.

## Test Framework

The tests are written using [Foundry](https://book.getfoundry.sh/), a blazing fast, portable, and modular toolkit for Ethereum application development.

## Test Structure

```
test/
├── ClearingHouse.t.sol          # Main test suite
├── mocks/
│   └── MockERC20.sol             # Mock ERC20 token for testing
└── helpers/
    └── TestHelpers.sol           # Helper functions and utilities
```

## Test Coverage

The test suite covers the following areas:

### 1. Contract Deployment and Initialization
- ✅ Successful deployment with valid parameters
- ✅ Deployment failure scenarios (zero address, invalid parameters)
- ✅ Initial state verification

### 2. Member Registration and Management
- ✅ Register new members with sufficient collateral
- ✅ Prevent registration with insufficient collateral
- ✅ Prevent duplicate registration
- ✅ Access control for registration
- ✅ Member deregistration

### 3. Collateral Management
- ✅ Deposit collateral
- ✅ Withdraw available collateral
- ✅ Prevent withdrawal of required collateral
- ✅ Automatic unrestriction when collateral is sufficient

### 4. Settlement Cycle Management
- ✅ Start new settlement cycle
- ✅ Prevent starting cycle too early
- ✅ Cycle state transitions

### 5. Net Position Submission
- ✅ Submit net positions within submission window
- ✅ Verify submitted positions
- ✅ Prevent submission outside window
- ✅ Signature verification

### 6. Settlement Execution (`settleTransaction` - Core Function)
- ✅ **Balanced positions settlement** - Normal case with balanced net positions
- ✅ **Settlement with insufficient collateral** - Triggers default handling
- ✅ **Empty positions settlement** - All zero net positions
- ✅ **Prevent settlement of non-finalized cycle**
- ✅ **Prevent double settlement**
- ✅ **Access control** - Only operators can settle

### 7. Default Handling and Risk Management
- ✅ Collateral seizure from defaulting member
- ✅ Insurance fund usage when collateral insufficient
- ✅ Loss socialization to non-defaulting members
- ✅ Default event recording
- ✅ Member restriction after default

### 8. Access Control
- ✅ Admin role permissions
- ✅ Operator role permissions
- ✅ Member role permissions
- ✅ Unauthorized access prevention

### 9. Emergency Controls
- ✅ Pause and unpause functionality
- ✅ Operations blocked when paused

### 10. Parameter Management
- ✅ Update settlement period
- ✅ Update minimum collateral requirement
- ✅ Update collateral haircut
- ✅ Parameter validation

### 11. Query Functions
- ✅ Get member count
- ✅ Get active member count
- ✅ Get default event count

## Prerequisites

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

## Running Tests

### Run All Tests

```bash
forge test
```

### Run Tests with Verbosity

```bash
forge test -vvv
```

### Run Specific Test

```bash
forge test --match-test test_SettleTransaction_BalancedPositions -vvv
```

### Run Tests for Specific Contract

```bash
forge test --match-contract ClearingHouseTest -vvv
```

### Generate Gas Report

```bash
forge test --gas-report
```

### Generate Coverage Report

```bash
forge coverage
```

### Generate Detailed Coverage Report (HTML)

```bash
forge coverage --report lcov
genhtml lcov.info -o coverage
```

Then open `coverage/index.html` in your browser.

## Test Scenarios

### Core Settlement Function Tests

#### 1. `test_SettleTransaction_BalancedPositions`

**Scenario**: Four banks with balanced net positions (total = 0)
- Bank1: +2M (receives)
- Bank2: +1M (receives)
- Bank3: -1.5M (pays)
- Bank4: -1.5M (pays)

**Expected Result**: 
- All transfers executed successfully
- Collateral balances updated correctly
- Cycle marked as settled

#### 2. `test_SettleTransaction_WithInsufficientCollateral`

**Scenario**: One bank needs to pay more than its available collateral
- Bank1: +15M (receives)
- Bank3: -15M (pays, but only has 10M collateral)

**Expected Result**:
- Default handling triggered
- Bank3's collateral seized
- Insurance fund used if available
- Loss socialized to other members if needed
- Bank3 marked as restricted
- Default event recorded

#### 3. `test_SettleTransaction_EmptyPositions`

**Scenario**: All banks submit zero net positions

**Expected Result**:
- Settlement completes successfully
- No balance changes
- Cycle marked as settled

#### 4. `testFail_SettleTransaction_NotFinalized`

**Scenario**: Attempt to settle before cycle is finalized

**Expected Result**: Transaction reverts

#### 5. `testFail_SettleTransaction_AlreadySettled`

**Scenario**: Attempt to settle the same cycle twice

**Expected Result**: Transaction reverts

#### 6. `testFail_SettleTransaction_ByNonOperator`

**Scenario**: Non-operator attempts to execute settlement

**Expected Result**: Transaction reverts (access control)

### Default Handling Tests

#### 7. `test_DefaultHandling_WithInsuranceFund`

**Scenario**: Default occurs with available insurance fund
- Bank3 defaults with 5M shortfall
- Insurance fund has 10M available

**Expected Result**:
- Collateral seized (10M)
- Insurance fund used to cover shortfall (5M)
- No loss socialization needed
- Default event recorded

#### 8. `test_LossSocialization`

**Scenario**: Default with shortfall exceeding collateral and insurance
- Bank3 defaults with 20M obligation but only 10M collateral
- No insurance fund available

**Expected Result**:
- Collateral seized (10M)
- Remaining 10M loss socialized to other members
- All non-defaulting members' collateral reduced proportionally

## Mock Contracts

### MockERC20

A simple ERC20 token implementation for testing purposes with:
- Configurable decimals
- Mint function for test setup
- Burn function for testing edge cases

## Helper Functions

### TestHelpers Library

Provides utility functions for tests:
- `calculateNetPositionHash()` - Calculate data hash for net positions
- `abs()` - Convert int256 to absolute uint256 value

## Continuous Integration

The test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      - name: Install dependencies
        run: forge install
      - name: Run tests
        run: forge test -vvv
      - name: Generate coverage
        run: forge coverage
```

## Best Practices

1. **Test Isolation**: Each test is independent and doesn't rely on state from other tests
2. **Setup Function**: Common setup logic is in the `setUp()` function
3. **Helper Functions**: Reusable test logic is extracted to helper functions
4. **Descriptive Names**: Test function names clearly describe what is being tested
5. **Assertions**: Multiple assertions verify different aspects of the outcome
6. **Edge Cases**: Tests cover both happy paths and failure scenarios
7. **Access Control**: Security-critical functions are tested for unauthorized access

## Troubleshooting

### Common Issues

**Issue**: `forge: command not found`
**Solution**: Install Foundry using the installation command above

**Issue**: `Error: Could not find artifact`
**Solution**: Run `forge build` to compile contracts first

**Issue**: `Error: Failed to resolve imports`
**Solution**: Run `forge install` to install dependencies

**Issue**: Tests fail with "out of gas"
**Solution**: Increase gas limit in `foundry.toml` or optimize contract code

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Add descriptive comments explaining the test scenario
3. Include both positive and negative test cases
4. Update this README with new test descriptions
5. Ensure all tests pass before submitting

## License

MIT License - See LICENSE file for details

## Contact

For questions or issues related to the test suite, please open an issue in the repository.

---

**Last Updated**: November 3, 2025
**Test Framework**: Foundry v0.2.0
**Solidity Version**: 0.8.20
