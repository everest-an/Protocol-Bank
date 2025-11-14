# Protocol Bank User Guide

**Version**: 1.1  
**Last Updated**: 2025-11-14  
**Author**: Manus AI

---

## 🚀 Welcome to Protocol Bank

Protocol Bank is a powerful decentralized payment management platform designed to help you effortlessly manage cryptocurrency payments, automate financial workflows, and save on Gas fees. This guide will walk you through the core features of Protocol Bank.

### Table of Contents

1. [Connecting Your Wallet](#1-connecting-your-wallet)
2. [Stream Payment](#2-stream-payment)
3. [Batch Payment](#3-batch-payment)
4. [Analytics](#4-analytics)
5. [Automation](#5-automation)
6. [Frequently Asked Questions (FAQ)](#6-frequently-asked-questions-faq)

---

## 1. Connecting Your Wallet

### 1.1 Connect Your Wallet

1.  **Click "Connect Wallet"**
    *   Find and click the "Connect Wallet" button in the top-right corner of the page.

2.  **Choose Your Wallet**
    *   MetaMask is currently supported, with WalletConnect and Coinbase Wallet support planned for the future.
    *   In the MetaMask pop-up window, select the account you wish to connect.

3.  **Confirm Connection**
    *   Click the "Connect" button to complete the authorization.
    *   Once connected, your wallet address will be displayed in the top-right corner.

### 1.2 Supported Networks

| Network Name   | Chain ID   | Type      | Status      |
|:---------------|:-----------|:----------|:------------|
| Sepolia        | 11155111   | Testnet   | ✅ Supported |
| Base Sepolia   | 84532      | Testnet   | ✅ Supported |
| Base Mainnet   | 8453       | Mainnet   | Planned     |

---

## 2. Stream Payment

Stream Payments allow you to pay a recipient continuously over time, second by second. This is ideal for salaries, subscriptions, and contractor fees.

### 2.1 Create a Single Stream

1.  **Go to the Stream Payment Page**
    *   Click "Payments" in the left-side navigation bar.

2.  **Click "Create Stream"**
    *   Find and click the "Create Stream" button in the top-right corner.

3.  **Fill Out the Form**
    *   **Stream Name**: Give your stream a name (e.g., "Monthly Salary for Alice").
    *   **Recipient Address**: Enter the recipient's Ethereum address.
    *   **Token**: Select the token to pay with (ETH, USDC, DAI, USDT).
    *   **Amount**: Enter the total payment amount.
    *   **Start Time**: Choose the payment start time.
    *   **End Time**: Choose the payment end time.
    *   **Category**: Select a payment category.

4.  **Confirm and Create**
    *   Check the estimated Gas fee.
    *   Click the "Create Stream" button.
    *   Confirm the transaction in MetaMask.

### 2.2 Manage Your Streams

On the Stream Payment page list, you can manage each stream:

*   **Pause**: Temporarily halt the payment stream.
*   **Resume**: Resume a paused payment stream.
*   **Stop**: Permanently stop the stream. The remaining funds will be returned to you.
*   **Cancel**: Cancel the stream. Paid and unpaid funds will be distributed proportionally.

---

## 3. Batch Payment

The Batch Payment feature allows you to send payments to multiple addresses in a single transaction, significantly saving on Gas fees using the X402 protocol.

### 3.1 Add Payments Manually

1.  **Go to the Batch Payment Page**
    *   On the "Payments" page, click the "Batch" tab.

2.  **Add Payment Items**
    *   Click the "Add Payment" button.
    *   Fill in the recipient's address, amount, and category.
    *   Repeat this step to add all payment items.

### 3.2 Import via CSV

1.  **Download Template**
    *   Click "Download Template" to get the CSV template.

2.  **Fill Out the CSV File**
    *   Fill in the recipient addresses, amounts, categories, and descriptions according to the template format.

3.  **Import CSV**
    *   Click "Import CSV" and select your edited file.
    *   The system will automatically parse and populate the payment list.

### 3.3 Execute Batch Payment

1.  **Enable X402**
    *   Ensure the "X402 Batch Settlement" switch is on to save on Gas fees.

2.  **Check Gas Fees**
    *   In the "Gas Fee Comparison" card, compare the costs between single and batch transactions.

3.  **Execute Payment**
    *   Click the "Execute Batch Payment" button.
    *   Confirm the transaction in MetaMask.

4.  **View Results**
    *   After the transaction is complete, you can view the details of successful and failed transactions in the "Transaction Results" section.

---

## 4. Analytics

The Analytics page provides you with comprehensive financial analysis to help you understand your cash flow.

### 4.1 View Financial Reports

1.  **Go to the Analytics Page**
    *   Click "Analytics" in the left-side navigation bar.

2.  **Switch Data Source**
    *   **Demo Data**: View sample data to explore the features.
    *   **Blockchain Data**: After connecting your wallet, view your real transaction data from the blockchain.

### 4.2 Use Analysis Tools

*   **Date Range Filter**: Select the time range to analyze (30 days, 90 days, 1 year, etc.).
*   **Period Switch**: View data on a monthly or yearly basis.
*   **Chart Analysis**: View cash flow trends, income vs. expense comparisons, and category pie charts.
*   **CSV Export**: Click "Export CSV" to export the analysis data.

---

## 5. Automation

The Automation page allows you to create automated payment workflows without manual intervention.

### 5.1 Create a Scheduled Payment

1.  **Go to the Automation Page**
    *   Click "Automation" in the left-side navigation bar.

2.  **Use the Flow Builder**
    *   In the "Flow Builder" view, create your workflow by dragging and dropping nodes.
    *   **Trigger**: Set the trigger condition for the flow (e.g., on the 1st of every month, every Monday).
    *   **Action**: Set the action to be performed (e.g., send a payment, call an API).
    *   **Condition**: Set a conditional judgment (e.g., if balance > 1000).

3.  **Deploy the Flow**
    *   Click "Deploy Flow" to deploy your workflow.
    *   You can view and manage all deployed flows in the "Deployed Flows" list.

---

## 6. Frequently Asked Questions (FAQ)

### Q1: What is the X402 protocol, and why does it save on Gas fees?

**A1**: X402 is an open payment protocol that allows multiple payment authorizations to be bundled into a single transaction for settlement. This way, you can avoid sending a separate transaction for each payment, which significantly saves on Gas fees, by up to 70%.

### Q2: Are my funds secure?

**A2**: Yes. Protocol Bank is a non-custodial platform, meaning your funds are always controlled by your own wallet. All transactions require your manual confirmation in MetaMask. The smart contract code has also been rigorously tested.

### Q3: Which networks can I use Protocol Bank on?

**A3**: We currently support the Sepolia and Base Sepolia testnets. We plan to support the Base mainnet and other major networks in the future.

### Q4: What happens if some transactions in a batch payment fail?

**A4**: Failed transactions will not affect other successful transactions. You can view the reason for the failure in the "Transaction Results" section and resubmit the failed transactions after correcting them.

### Q5: Can I export my transaction data?

**A5**: Yes. On the Analytics page, you can export your transaction data as a CSV file at any time for analysis in other software (like Excel).

---

**Need more help?**

If you have any questions or suggestions, feel free to contact us through the following channels:

*   **Email**: support@protocolbank.com
*   **Discord**: [discord.gg/protocolbank](https://discord.gg/protocolbank)
*   **GitHub**: [github.com/everest-an/Protocol-Bank](https://github.com/everest-an/Protocol-Bank)
