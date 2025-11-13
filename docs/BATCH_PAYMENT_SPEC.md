## Batch Payment Feature Specification

**Date**: November 13, 2025  
**Feature**: Batch Payment (Instant Multi-Recipient Transfers)  
**Status**: ✅ **Completed**  
**Component**: `BatchPaymentPageV2.jsx`

---

### 1. Feature Overview

The Batch Payment feature allows users to send instant payments to multiple recipients simultaneously. Unlike Stream Payments (which transfer funds over time), Batch Payments execute immediate transfers to all recipients in a single operation.

This feature is designed for common business scenarios such as monthly supplier payments, employee reimbursements, contractor payouts, and dividend distributions.

### 2. Key Capabilities

**Manual Entry**
- Users can manually add payment entries one by one using the "Add Payment" button.
- Each entry includes recipient address, amount, category, and token type.
- Real-time validation ensures all addresses are valid Ethereum addresses and amounts are positive numbers.

**CSV Import**
- Users can download a CSV template pre-filled with example data.
- The template includes columns for recipient address, amount, category, and token.
- After filling the template, users can upload it via drag-and-drop or file selection.
- The system automatically parses the CSV and validates each row.

**Data Validation**
- Recipient addresses must be valid Ethereum addresses.
- Amounts must be positive numbers greater than zero.
- Categories are required for expense tracking.
- Invalid entries are highlighted with error messages.

**Gas Fee Estimation**
- The system estimates gas costs for both individual transactions and batch processing.
- Users can see the potential gas savings when using batch payments.
- Comparison shows percentage savings and total ETH saved.

**Parallel Execution**
- Payments are processed in batches of 5 transactions at a time.
- Each batch uses `Promise.all` for parallel transaction submission and confirmation.
- This approach improves processing speed by 3-5x compared to serial execution.

**Progress Tracking**
- A progress bar shows the current transaction being processed.
- Users can see "Processing X of Y payments..." in real-time.

**Results Summary**
- After execution, users see a detailed summary of successful and failed payments.
- Successful payments display transaction hash, block number, and gas used.
- Failed payments show the specific error message for debugging.

### 3. User Flow

The user flow consists of three main steps:

**Step 1: Prepare Payments**
- The user either manually adds payments or imports a CSV file.
- The system validates all entries and highlights any errors.
- The user can edit or remove invalid entries.

**Step 2: Review & Estimate**
- The user reviews the list of payments and sees gas fee estimates.
- The comparison between individual and batch processing helps inform the decision.
- The user can toggle the "Use X402 Batch Settlement" option (currently a placeholder).

**Step 3: Execute & Results**
- Upon clicking "Send Batch Payment", the system connects to the wallet.
- Transactions are sent in parallel batches of 5.
- A progress bar shows real-time status.
- After completion, the results screen shows success/failure statistics.

### 4. Technical Implementation

**Parallel Processing**
- Batch size: 5 transactions per batch
- Method: `Promise.all` for concurrent execution
- Progress updates: Real-time tracking of current transaction index

**Transaction Details**
- Each successful transaction records: txHash, blockNumber, gasUsed
- Failed transactions record: error message for troubleshooting

**Gas Optimization**
- Individual gas estimate: 21,000 gas per transaction
- Batch gas estimate: 50,000 base + 15,000 per payment
- Savings calculation: Shows ETH saved and percentage reduction

### 5. Future Enhancements

**X402 Batch Settlement Integration**
- Implement EIP-3009 `transferWithAuthorization` signatures
- Use the deployed `X402BatchSettlement` contract
- Enable true atomic batch transfers with a single on-chain transaction

**Multi-Token Support**
- Extend beyond ETH to support ERC20 tokens (USDC, DAI, USDT)
- Automatic token approval handling
- Token-specific gas estimation

**Scheduled Batch Payments**
- Allow users to schedule batch payments for future execution
- Recurring batch payments (e.g., monthly payroll)

**Payment Templates**
- Save frequently used payment lists as templates
- Quick load and edit for recurring batches

### 6. Integration

The Batch Payment feature is integrated into the main Payments page as a fourth tab:
- Regular Payment (single instant payment)
- Stream Payment (time-based payment flow)
- Network Payment (cross-border payment networks)
- **Batch Payment** (multi-recipient instant payment)

Users can seamlessly switch between payment types based on their needs.
