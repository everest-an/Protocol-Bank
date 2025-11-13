

## Frontend Integration

**Date**: November 13, 2025

### 1. X402 Service (`x402Service.js`)

- **`prepareBatchAuthorizations`**: Generates EIP-3009 signatures for a batch of payments.
- **`executeBatchSettlement`**: Calls the `X402BatchSettlement` smart contract.
- **`checkUSDCBalance`**: Checks if the user has enough mock USDC.
- **`requestTestUSDC`**: Mints test USDC from the faucet.

### 2. Batch Payment Page (`BatchPaymentPageV2.jsx`)

- **UI**: Added a toggle to switch between parallel ETH transfers and X402 batch settlement.
- **Logic**: 
  - If X402 is enabled, the component now calls `prepareBatchAuthorizations` to sign all payments.
  - Then, it calls `executeBatchSettlement` to send a single transaction to the blockchain.
  - Includes a balance check and a faucet request for a better user experience.

### 3. Smart Contracts

- **`MockUSDC_EIP3009.sol`**: Deployed to Sepolia at `0x114E248bdF47Bad9948bF94d84848bAC1E36b75C`.
- **`X402BatchSettlement.sol`**: Deployed to Sepolia at `0x47C1eC37fB91E69e0FCD901B2F89b40FD724E11b`.
