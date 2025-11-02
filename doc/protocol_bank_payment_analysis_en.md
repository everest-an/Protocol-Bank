# Protocol Bank: Blockchain-Driven Revolution in Global Payment Infrastructure

**Author**: EverestAn

**Date**: November 2, 2025

---

## Abstract

Protocol Bank represents a fundamental paradigm shift in global payment infrastructure. By deeply integrating blockchain technology with traditional financial systems, Protocol Bank has built a decentralized, efficient, and intelligent global payment network designed to replace the inefficient correspondent banking system and SWIFT network. This report analyzes in depth how Protocol Bank achieves breakthrough innovations—1000x faster payment speeds and 50-100x cost reductions—through smart contracts, streaming payments, hybrid settlement architecture, and a unique protocol governance philosophy, examining four dimensions: technical architecture, innovative mechanisms, practical applications, and economic value. Research shows that Protocol Bank is not merely a technical optimization of traditional payment systems, but a financial philosophy revolution from "profit maximization" to "service optimization," laying a solid foundation for the future machine economy and AI agent payments.

---

## 1. Introduction: The Dilemma of Global Payment Systems and the Need for Transformation

### 1.1 Structural Defects of Traditional Payment Systems

The current global cross-border payment infrastructure is built upon the correspondent banking network and SWIFT messaging system designed in the 1970s. This system has exposed serious structural defects in the digital age, becoming a bottleneck for global economic development.

According to World Bank data, traditional cross-border payment systems suffer from the following core problems:

**High Transaction Costs**: A simple cross-border remittance typically passes through 3-5 intermediary banks, each charging fees and foreign exchange spreads. The total cost borne by end users can reach 5-10% of the transaction amount, imposing a huge burden on small businesses and individual users.

**Slow Settlement Times**: Due to reliance on batch processing and cross-timezone coordination, cross-border payment settlement typically takes 2-5 business days. This delay ties up corporate working capital and reduces capital efficiency. For trading companies requiring rapid turnover, such delays can result in missed business opportunities.

**Complete Lack of Transparency**: Once a payment is initiated, funds enter a "black box" state. Neither payers nor payees can track fund locations in real-time, estimate arrival times, or identify specific fees deducted along the way. This opacity makes reconciliation difficult and undermines user trust in the system.

**High Operating and Compliance Costs**: Financial institutions must maintain complex correspondent banking relationships across multiple countries and pre-deposit large amounts of capital in Nostro/Vostro accounts. It is estimated that the global banking system has over $5 trillion locked in these accounts, capital that cannot generate effective returns, creating enormous capital waste.

### 1.2 Transformation Opportunities Brought by Blockchain Technology

Blockchain technology provides an entirely new technical path for solving these problems. Through distributed ledgers, smart contracts, and cryptocurrencies, blockchain can achieve disintermediation, real-time settlement, transparent traceability, and programmability. Protocol Bank emerged in this context, not simply moving traditional payment systems "onto the chain," but redesigning from scratch a modern, decentralized global payment network deeply integrated with traditional financial systems.

---

## 2. Protocol Bank Technical Architecture: Hybrid Innovation Design

### 2.1 Overall Architecture Overview

Protocol Bank adopts a unique **Hybrid Architecture** that cleverly connects traditional financial systems with the blockchain world. This design allows it to simultaneously enjoy blockchain's technical advantages and traditional financial systems' liquidity and compliance.

The entire system consists of four core layers:

| Architecture Layer | Function | Technical Implementation |
|-------------------|----------|------------------------|
| **Fiat Gateway Layer** | Connects traditional RTGS systems, enabling bidirectional conversion between fiat and stablecoins | Fedwire, TARGET2, CHIPS, CHAPS, CIPS integration |
| **Blockchain Settlement Layer** | Executes on-chain transaction settlement and smart contracts | Solana high-performance blockchain + Rust smart contracts |
| **Smart Contract Layer** | Implements innovative functions like streaming payments, batch payments, staking payments | StreamPayment, BatchPayment, ScheduledPayment, StakePayment |
| **Application Interface Layer** | Provides RESTful API and Web3 interfaces for user and institutional access | API Gateway + Web3 Provider (ethers.js) |

### 2.2 Fiat Gateway: Bridge Connecting Two Worlds

One of Protocol Bank's core innovations is its **Fiat Gateway System**. This system achieves seamless conversion between traditional fiat currencies and on-chain stablecoins by establishing direct or near-direct connections with major global Real-Time Gross Settlement (RTGS) systems.

#### 2.2.1 Supported Global Payment Networks

Protocol Bank integrates the following key financial highways:

- **Fedwire (USA)**: Handles real-time gross settlement of USD, with daily transaction volume exceeding $3.5 trillion
- **TARGET2 (Europe)**: Core payment system for the Eurozone, connecting all EU central banks
- **CHIPS (USA)**: World's largest private USD clearing system, processing $1.5 trillion daily
- **CHAPS (UK)**: Real-time payment system for GBP
- **CIPS (China)**: RMB cross-border payment system supporting Belt and Road trade settlement

Through these gateways, Protocol Bank can directly access clearing networks for major global currencies, bypassing traditional multi-layer correspondent banking chains.

#### 2.2.2 Fiat-Stablecoin Conversion Mechanism

The fiat gateway workflow is as follows:

```
Deposit Flow:
User fiat account → Fedwire/TARGET2 → Protocol Bank gateway 
→ Mint equivalent USDC/EURC → User on-chain wallet

Withdrawal Flow:
User on-chain wallet → Burn USDC/EURC → Protocol Bank gateway 
→ Fedwire/TARGET2 → User fiat account
```

This mechanism ensures that every on-chain stablecoin has 1:1 fiat reserve backing while achieving seamless connection between the fiat and crypto worlds.

### 2.3 Blockchain Settlement Layer: Solana's Performance Advantages

Protocol Bank chose Solana as its primary settlement layer based on the following technical considerations:

| Performance Metric | Solana | Ethereum | Traditional SWIFT |
|-------------------|--------|----------|------------------|
| **Throughput** | 65,000+ TPS | 15-30 TPS | Batch processing |
| **Confirmation Time** | 400 milliseconds | 12-15 seconds | 2-5 days |
| **Transaction Cost** | <$0.001 | $1-50 | $25-50 |
| **Operating Hours** | 24/7 | 24/7 | Business days |

Solana's high throughput and low latency characteristics enable it to handle global-level payment traffic while maintaining extremely low transaction costs. This provides the technical foundation for Protocol Bank to realize a "micropayment economy."

### 2.4 Smart Contract Layer: Four Innovative Payment Models

Protocol Bank implements four innovative payment models through a carefully designed set of smart contracts:

#### 2.4.1 Streaming Payment

Streaming payment is one of Protocol Bank's most innovative features. Unlike traditional one-time transfers, streaming payments release funds continuously over time, achieving the ideal state of "payment by the second."

**Core Algorithm**:
```
Withdrawable Amount = Total Amount × (Current Time - Start Time) / (End Time - Start Time)
```

**Application Scenarios**:

For salary distribution, employees can withdraw wages corresponding to hours worked at any time without waiting until month-end. This model greatly enhances employees' financial flexibility, especially for emergency fund needs. In subscription services, users pay based on actual usage time while service providers receive payments in real-time, achieving true "pay as you use." In supply chain finance, payments are automatically released according to delivery progress, reducing trust costs and capital risks for both buyers and sellers.

This model fundamentally changes the time granularity of "payment" from "month" to "second," greatly improving capital flow efficiency.

#### 2.4.2 Staking Payment

Staking payment implements conditional fund release, suitable for transaction scenarios requiring third-party verification. The workflow includes: payer creates staking contract and sets milestones and verification conditions, funds locked in smart contract; payee completes work and submits proof; verifier (VC/LP/third-party audit) reviews results; upon verification approval, smart contract automatically releases funds, otherwise refunds.

This mechanism has broad application value in venture capital, project outsourcing, international trade, and other fields. It ensures transaction security through code rather than legal contracts, significantly reducing dispute resolution costs.

#### 2.4.3 Batch Payment

Batch payment allows users to transfer to multiple payees in a single transaction, significantly reducing gas fees and operational complexity. Efficiency comparison shows that traditional methods require 100 transactions and 100x gas fees for 100 payees, while batch payment requires only 1 transaction and 1x gas fees.

For enterprises that regularly pay large numbers of suppliers or employees, this function can save over 90% of transaction costs.

#### 2.4.4 Scheduled Payment

Scheduled payment supports automated payments triggered by time or conditions, integrable with Chainlink Automation or backend scheduled tasks. Typical applications include automatic monthly salary distribution, payments triggered when prices reach specific thresholds, and AI agents autonomously executing payments based on market conditions.

This enables building fully automated financial systems where enterprises can preset payment rules and the system executes automatically without human intervention.

---

## 3. Protocol Bank's Core Philosophy: Thought Revolution Beyond Traditional Finance

### 3.1 Protocol as Its Own Owner

Protocol Bank's most radical innovation lies in its governance philosophy: **100% of all revenue generated by the protocol returns to the protocol's own treasury**, rather than being distributed to external token holders or company shareholders.

This design has profound implications. First is capital self-accumulation: as transaction volume grows, the protocol treasury continuously expands, enabling it to provide deeper liquidity to reduce user transaction slippage, enhance stablecoin reserve backing to improve system risk resistance, and fund long-term R&D and ecosystem building. Second is elimination of conflicts of interest: no external shareholders means the protocol doesn't need to sacrifice user experience for short-term profits; all decisions revolve around "how to better serve users."

### 3.2 Value in Service, Not in Token

Protocol Bank refuses to issue tradable governance tokens, which is extremely rare in the current DeFi ecosystem. This choice is based on a core belief: **the system's value should not be measured by token price, but by the quality of services it provides**.

This philosophy manifests in three aspects: in terms of stability, the more reserves in the protocol treasury, the more robust its issued stablecoins; in terms of efficiency, the deeper the liquidity held by the protocol, the lower the slippage for user transactions; in terms of reliability, protocol rules are permanently locked in code, unchanged by human voting.

### 3.3 Achieving Governance Through Inaction

Protocol Bank adopts a "governance through inaction" model: all core rules are immutably embedded in smart contracts at creation, and the system autonomously responds to market changes through preset algorithms (such as automatic interest rate adjustments).

This design eliminates interference from human greed, short-sightedness, and political struggle, making the system operate autonomously like a machine governed by physical laws. This contrasts sharply with traditional DeFi projects relying on community voting governance, which often fall into traps of political gaming and short-termism.

### 3.4 Lending as Capital Repatriation to the People

Protocol Bank redefines the purpose of lending: **transforming from a tool for creating institutional profits to a public service returning capital to the people**.

#### 3.4.1 Eliminating Profit-Driven Interest Spreads

Traditional banks profit from the spread between depositor interest (1-2%) and borrower interest (5-8%). Protocol Bank automates all lending operations through smart contracts, reducing operating costs to near zero, thereby eliminating the necessity of large interest spreads.

The minimal interest spread that exists is used only to cover protocol maintenance and development costs, hedge systemic risks and potential defaults, and ensure platform long-term sustainability. This represents a fundamental shift from **profit maximization** to **cost minimization**.

#### 3.4.2 Efficient Capital Circulation

This creates a virtuous cycle: for depositors, earning yields that closely track true market interest rates; for borrowers, obtaining capital at costs that merely reflect actual risks; for the economy, more efficient capital circulation promoting productive economic activity.

Protocol Bank acts as a transparent intermediary rather than a profit-extracting middleman. Smart contracts execute lending operations with mathematical precision and complete transparency, with all interest rates, collateral requirements, and liquidation parameters visible on-chain and unchangeable arbitrarily.

---

## 4. Actual Value of Payment Innovation: Quantitative Analysis

### 4.1 Efficiency Improvement: From Days to Minutes

Taking China-US cross-border trade payments as an example, we can clearly see the efficiency revolution brought by Protocol Bank:

| Dimension | Traditional SWIFT | Protocol Bank | Improvement Factor |
|-----------|------------------|--------------|-------------------|
| Settlement Time | 3-5 days | 2-5 minutes | **1000x** |
| Transaction Fee | $50-100 | <$0.1 | **500-1000x** |
| Number of Intermediaries | 3-5 banks | 0 | **Eliminated** |
| Exchange Rate Transparency | Opaque | Fully transparent | **Qualitative leap** |

Economic impact: global cross-border payment market size is approximately $150 trillion/year. If Protocol Bank is adopted, it could save $7.5-15 trillion/year in fees and release $5 trillion in capital locked in Nostro accounts.

### 4.2 Cost Revolution: Redefining Payment Economics

#### 4.2.1 Realizing Micropayment Economy

Traditional payment systems cannot support small payments due to high fixed costs ($0.25-1). Protocol Bank reduces single transaction costs to <$0.001, making the following scenarios possible:

Pay per API call, charging $0.0001 per call; pay per reading time, charging $0.001 per minute of article reading; pay per data volume, charging $0.00001 per KB of data processed.

This unlocks entirely new business models and lowers barriers to entry for service providers and consumers. Many business models previously unfeasible due to excessive payment costs now become viable.

#### 4.2.2 Capital Efficiency Improvement

The global banking system has approximately $5 trillion locked in Nostro accounts. Protocol Bank requires no pre-deposited funds and settles in real-time. Assuming 50% capital release with 5% annualized returns, this could generate $125 billion in additional value annually.

This released capital can be invested in more productive areas, promoting global economic growth.

### 4.3 Security Enhancement: From Trust to Verification

| Security Dimension | Traditional System | Protocol Bank |
|-------------------|-------------------|--------------|
| **Transaction Records** | Centralized database, alterable | Blockchain immutable |
| **Fund Control** | Bank controlled | Smart contract controlled, multi-sig protected |
| **Transparency** | Black box operations | All transactions publicly verifiable |
| **Single Point of Failure** | Exists | Eliminated by decentralized network |
| **Audit** | Periodic manual audit | Real-time on-chain audit |

Blockchain's immutability and transparency fundamentally change the trust model of financial systems. Users no longer need to trust banks or intermediary institutions, only open-source, audited smart contract code.

### 4.4 Intelligence Upgrade: Infinite Possibilities of Programmable Payments

Protocol Bank's smart contract layer upgrades payments from "static transfers" to "programmable dynamic value flows." Conditional payments can automatically release funds based on work verification results, and dynamic pricing can adjust payment amounts in real-time based on network congestion and exchange rates.

This lays the foundation for advanced applications such as AI agent autonomous payments, dynamic market pricing, and complex financial derivatives. Payment is no longer an isolated action but an intelligent component embedded in automated workflows.

---

## 5. Synergy with EIP-8004 and x402: Building Payment Infrastructure for Machine Economy

### 5.1 Perfect Complementarity of Three-Layer Architecture

Protocol Bank can form a complete machine economy payment stack with EIP-8004 and x402:

| Layer | Protocol | Function |
|-------|----------|----------|
| **Identity & Trust Layer** | EIP-8004 | Provides on-chain identity, reputation, and work verification for AI agents |
| **Payment Request Layer** | x402 | Implements instant payment requests through HTTP 402 status code |
| **Settlement & Liquidity Layer** | Protocol Bank | Executes actual fund settlement, provides liquidity and financial services |

### 5.2 Complete AI Agent Payment Process

A complete inter-AI agent payment process is as follows: AI Agent A (with EIP-8004 identity) requests services from AI Agent B; Agent B returns x402 challenge requiring payment of 0.01 USDC; Agent A queries Agent B's EIP-8004 reputation score; Agent A creates streaming payment through Protocol Bank; Protocol Bank smart contract locks 0.01 USDC; Agent B provides service; Agent A requests EIP-8004 validation registry to verify work results; upon verification approval, Protocol Bank automatically releases funds to Agent B; Agent B's reputation score updates.

This process achieves fully automated, human-intervention-free machine-to-machine payments.

### 5.3 Protocol Bank's Unique Value

In this ecosystem, Protocol Bank provides critical capabilities that EIP-8004 and x402 cannot:

Providing immediately available USDC/EURC liquidity for AI agents; supporting advanced functions like streaming payments and staking payments; connecting traditional financial systems, supporting fiat deposits/withdrawals; through Protocol Bank's financialization layer, AI agents' future income can be tokenized and financed.

If EIP-8004 is the AI agent's "ID card" and x402 is the "payment request protocol," then Protocol Bank is the "bank account" and "financial service provider." The three combined constitute the complete financial infrastructure of the machine economy.

---

## 6. Practical Application Scenarios: From Theory to Practice

### 6.1 Cross-Border Trade Settlement

**Scenario**: Chinese exporter exports $1 million worth of goods to US importer

**Traditional Process**: Importer initiates wire transfer through US bank, US bank contacts intermediary bank via SWIFT, intermediary bank contacts Chinese correspondent bank, Chinese correspondent bank contacts exporter's bank, exporter's bank credits account. The entire process takes 3-5 days with fees of $500-1000.

**Protocol Bank Process**: Importer initiates payment (USD) through Protocol Bank, Fedwire gateway converts USD to USDC, USDC settles on Solana chain, CIPS gateway converts USDC to RMB, exporter receives RMB. The entire process takes less than 5 minutes with fees under $1.

Value improvement: 99.9% time reduction, 99.8% cost reduction, and fully transparent and traceable. This efficiency improvement is revolutionary for international trading companies—it not only reduces costs but more importantly accelerates capital turnover speed and improves capital efficiency.

### 6.2 Supply Chain Finance

**Scenario**: Automotive manufacturer pays 100 parts suppliers according to delivery progress

**Protocol Bank Solution**: Manufacturer creates 100 streaming payment contracts, each corresponding to one supplier with total amount equal to order amount. As parts are delivered, funds are automatically released proportionally, suppliers can withdraw unlocked funds at any time, manufacturer monitors all payment streams in real-time.

Advantages include: suppliers gain better cash flow (no need to wait for month-end settlement), manufacturer reduces financial management costs (automated execution), bank financing costs decrease (transparent on-chain payment records).

This model is particularly suitable for complex supply chain networks, automating payment processes that traditionally require extensive manual coordination through smart contracts.

### 6.3 Salary Distribution

**Scenario**: Tech company distributes salaries to 1000 employees

**Protocol Bank Solution**: Company creates 1000 streaming payment contracts, each corresponding to one employee with duration of 1 month. Employees can withdraw wages corresponding to hours worked at any time, with automatic settlement of remaining amounts at month-end.

Employee value: enhanced financial flexibility (no need to wait for payday), improved emergency fund availability, real-time work incentives. Company value: reduced financial management costs, improved employee satisfaction, reduced capital tied up in advance wages.

This "payment by the second" model for salaries could fundamentally change how labor markets operate—employees no longer need to wait for fixed paydays but can access earned compensation at any time.

---

## 7. Challenges and Risks: Rational Assessment

### 7.1 Regulatory Compliance Challenges

Different countries have vastly different regulatory policies on cryptocurrencies and stablecoins, cross-border payments involve Anti-Money Laundering (AML) and Know Your Customer (KYC) requirements, and some countries may prohibit or restrict stablecoin use.

Protocol Bank's response strategies include: adopting ISO 20022 messaging standards for compatibility with traditional financial systems, integrating KYC/AML compliance modules, partnering with licensed financial institutions to operate fiat gateways, and supporting regulatory authorities' real-time auditing of on-chain transactions.

Regulatory compliance is one of Protocol Bank's greatest challenges. Technical innovation must adapt to regulatory frameworks, requiring long-term communication and coordination with regulatory authorities in various countries.

### 7.2 Technical Risks

Regarding smart contract vulnerabilities, historically multiple DeFi projects have lost hundreds of millions of dollars due to smart contract bugs; Protocol Bank requires continuous security audits and formal verification. Regarding blockchain performance bottlenecks, even Solana may experience network congestion under extreme circumstances, requiring multi-chain backup solutions and Layer 2 scaling. Regarding key management, users losing private keys will permanently lose funds, requiring solutions like social recovery and multi-sig wallets.

Managing technical risks requires multi-layered security measures including code audits, bug bounty programs, and insurance mechanisms.

### 7.3 Adoption Barriers

Regarding user education, average users have limited understanding of blockchain and crypto wallets, requiring simple user interfaces and educational resources. Regarding network effects, payment network value is proportional to user numbers, requiring sufficient initial users and liquidity to form positive feedback loops. Regarding traditional financial institution resistance, Protocol Bank threatens banks' cross-border payment business revenue and may face lobbying and regulatory pressure.

Overcoming these barriers requires time and patience. Protocol Bank needs to start with small-scale pilot projects, gradually accumulating users and liquidity to eventually form network effects.

---

## 8. Future Outlook: The Endgame of Payment Infrastructure

### 8.1 From Payment Network to Financial Operating System

Protocol Bank's vision is not merely a payment network but a complete **Decentralized Financial Operating System**, including payment layer (streaming payments, batch payments, staking payments), lending layer (ultra-low spread lending services), trading layer (automated market makers and foreign exchange engines), derivatives layer (futures, options, structured products), and insurance layer (smart contract insurance and risk hedging).

Realizing this vision will make Protocol Bank a core component of global financial infrastructure.

### 8.2 Deep Integration with AI Economy

As AI agents proliferate, Protocol Bank will become core infrastructure for the machine economy, supporting AI agent native payments, dynamic pricing algorithms, intelligent asset management, and predictive liquidity provisioning.

In the future machine economy, AI agents will become primary economic participants requiring a native, automated payment infrastructure. Protocol Bank is designed precisely for this future.

### 8.3 Global Financial Inclusion

Protocol Bank has potential to provide financial services to the world's 1.7 billion unbanked population through low-barrier access (requiring only smartphone and internet), no credit history needed (credit assessment based on on-chain behavior), micro-amount services (supporting $0.01 level financial services), and localized payments (supporting various national fiat currencies and local payment habits).

This is not only technical innovation but also social value manifestation. Protocol Bank has potential to provide modern financial services to billions globally for the first time.

---

## 9. Conclusion: The Beginning of Paradigm Shift

Protocol Bank represents a fundamental paradigm shift in global payment infrastructure. It is not a minor fix to traditional systems but a redesign from first principles of how payments should operate.

### 9.1 Core Innovation Summary

Technical dimension: hybrid architecture connecting traditional finance and blockchain, smart contracts implementing programmable payment logic, high-performance blockchain supporting global-level transaction volumes. Economic dimension: 50-100x cost reduction, 1000x speed improvement, trillions of dollars in locked capital released. Philosophical dimension: from profit maximization to service optimization, from centralized control to decentralized autonomy, from trusting intermediaries to verifying code.

### 9.2 Profound Impact on Global Economy

If Protocol Bank successfully realizes its vision, it will bring the following profound impacts:

For enterprises: significantly reduced cross-border trade costs promoting globalization, improved supply chain finance efficiency reducing financing costs, automated financial management releasing human resources. For individuals: reduced cross-border remittance costs benefiting migrant workers, improved financial service accessibility promoting financial inclusion, real-time salary distribution enhancing financial flexibility. For financial systems: banks liberated from inefficient payment business to focus on high-value-added services, improved capital efficiency promoting economic growth, enhanced financial system transparency and stability.

### 9.3 Final Thoughts

Protocol Bank's success depends not only on technical sophistication but also on gaining broad recognition from regulatory authorities, financial institutions, and users. This requires finding delicate balance between innovation and compliance, decentralization and user experience, idealism and realism.

However, the historical trend is clear: **payment systems will inevitably evolve from closed, inefficient, expensive correspondent banking models to open, efficient, low-cost decentralized networks**. Protocol Bank is the pioneer of this evolution.

Just as internet protocols (TCP/IP) replaced closed telecommunications networks, Protocol Bank has potential to become the new protocol for global payments—an open, programmable financial infrastructure controlled by code rather than institutions. This is not only a victory of technology but also a victory of the philosophy that "finance should serve the people, not exploit them."

---

## References

1. Protocol Bank Complete Whitepaper (Chinese), https://github.com/everest-an/Protocol-Bank/blob/main/docs/protocol_bank_complete_whitepaper_zh.md
2. Protocol Bank Core Ideas, https://github.com/everest-an/Protocol-Bank/blob/main/docs/core_ideas_zh.md
3. Protocol Bank System Architecture, https://github.com/everest-an/Protocol-Bank/blob/main/SYSTEM_ARCHITECTURE.md
4. Thunes, "How Blockchain Revolutionises Cross-Border Payments", https://www.thunes.com/insights/blockchain-cross-border-payments/
5. Federal Reserve, "Opening remarks by Governor Waller at the Payments Innovation Conference", https://www.federalreserve.gov/newsevents/speech/waller20251021a.htm
6. BVNK, "Blockchain in cross-border payments: a complete 2025 guide", https://bvnk.com/blog/blockchain-cross-border-payments
7. PwC, "What can instant payments and blockchain do for your bank?", https://www.pwc.com/us/en/industries/financial-services/library/instant-payments-blockchain-for-banks.html
8. Lewis, R. (2017), "Blockchain and Financial Market Innovation", Chicago Fed Economic Perspectives
9. IMF, "The Promise and Pitfalls of Decentralized Finance", https://www.imf.org/zh/Publications/fandd/issues/2022/09/Defi-promise-and-pitfalls-Fabian-Schar
10. Coinbase, "What is a smart contract?", https://www.coinbase.com/zh-cn/learn/crypto-basics/what-is-a-smart-contract
