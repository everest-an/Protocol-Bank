# Protocol Bank: Technical Implementation Guide (v0.9 PoC)

**Authors**: Manus AI & User

**Date**: November 3, 2025

**Audience**: Security Engineers, Cryptography Students, Blockchain Developers

---

## 1. Introduction

This document provides a technical deep-dive into the implementation of the Protocol Bank proof-of-concept (PoC). It is intended to be a companion to the project's whitepaper, focusing on the "how" rather than the "why". This guide will walk through the Rust codebase, explain key implementation details, and highlight the specific security limitations identified during our automated review process.

**WARNING**: This project is an **educational proof-of-concept** and is fundamentally insecure for any real-world application. Do not use this code to manage real assets.

### 1.1. Prerequisites

To understand this guide, you should have a basic familiarity with:

-   The Rust programming language
-   Public-key cryptography (ECDSA)
-   The core concepts of Multi-Party Computation (MPC)
-   The core concepts of Post-Quantum Cryptography (PQC)

### 1.2. Environment Setup

To compile and run the PoC, you will need:

-   Rust toolchain (>= 1.70)
-   `build-essential` (or equivalent C compiler toolchain)
-   `libgmp-dev` (for the underlying big number arithmetic)

```bash
# Install dependencies (on Debian/Ubuntu)
sudo apt-get update
sudo apt-get install -y build-essential libgmp-dev

# Clone the repository
git clone <repository_url>
cd Protocol-Bank/加密设施/mpc-wallet

# Build the project
cargo build

# Run the demonstration
cargo run
```

---

## 2. Code Structure

The project is organized into several key Rust modules within the `src` directory:

-   `main.rs`: The main entry point. It orchestrates the demonstration, initializes the components, and runs the simulation.
-   `encryption.rs`: Implements the Kyber-1024 + AES-256-GCM hybrid encryption scheme.
-   `policy_engine.rs`: Implements the logic for the Policy Engine tier.
-   `three_tier_demo.rs`: Contains the code for the high-level demonstration scenarios.

## 3. Deep Dive: `encryption.rs`

This module is responsible for the post-quantum protection of the MPC key shares. It combines a Key Encapsulation Mechanism (KEM) with a Data Encapsulation Mechanism (DEM).

### 3.1. Hybrid Encryption Flow

The `HybridEncryption::encrypt` function performs the following steps:

1.  **Generate Shared Secret**: It calls `kyber1024::encapsulate`, which takes the recipient's public Kyber key and returns a **shared secret** (32 bytes) and a **ciphertext**. The ciphertext is the encapsulated shared secret, which can only be decapsulated by the owner of the corresponding Kyber private key.
2.  **Derive AES Key**: The 32-byte shared secret is used directly as the key for AES-256-GCM.
    > **Security Limitation (GEMINI-R2)**: In a production system, one should not use the raw output of a KEM directly as a symmetric key. A Key Derivation Function (KDF) like HKDF should be used to improve the key's cryptographic properties. `derived_key = HKDF-SHA256(salt, shared_secret, info_string)`.
3.  **Generate Nonce**: A unique 12-byte nonce is generated for each encryption using `OsRng`. This is critical for the security of AES-GCM.
4.  **Encrypt Data**: The actual data (the MPC key share) is encrypted using AES-256-GCM with the derived key and the nonce.
5.  **Package**: The Kyber ciphertext, the AES-encrypted data, and the nonce are bundled into the `EncryptedPackage` struct for storage.

### 3.2. Decryption Flow

The `HybridEncryption::decrypt` function reverses the process:

1.  **Decapsulate Shared Secret**: It calls `kyber1024::decapsulate` with the recipient's private Kyber key and the ciphertext to recover the original 32-byte shared secret.
2.  **Derive AES Key**: The same key derivation logic is applied.
3.  **Decrypt Data**: AES-256-GCM is used with the key and the stored nonce to decrypt the MPC key share.

---

## 4. Deep Dive: `policy_engine.rs`

This module simulates the Policy Engine. In a real system, this would be a separate, highly-available microservice.

### 4.1. Core Structures

-   `TransactionRequest`: Represents an incoming request to make a transaction.
-   `PolicyRule`: An enum defining the types of rules the engine can enforce (e.g., `AmountLimit`, `Whitelist`).
-   `AuthorizationToken`: A struct representing the signed permission slip issued by the engine.

### 4.2. Policy Evaluation

The `evaluate_transaction` function iterates through all configured rules and checks if the transaction request violates any of them. 

> **Security Limitation (GEMINI-R2)**: The current implementation of the `DailyLimit` check is vulnerable to **race conditions**. It follows a non-atomic read-modify-write pattern. A production system must use a transactional database or a distributed lock manager to ensure atomic updates to shared state like daily limits.

### 4.3. Authorization Token

In the improved PoC, the `AuthorizationToken` is a central part of the security model. However, the implementation is still a simulation.

> **Security Limitation (GEMINI-R2)**: The token's `signature` field is just a mock string. A production system must:
> 1.  Have the Policy Engine hold its own private key (separate from all MPC keys).
> 2.  Sign the hash of the token's contents (including the transaction hash, expiry, etc.).
> 3.  Require the MPC nodes to verify this signature before proceeding.

---

## 5. Deep Dive: `main.rs` (The Orchestrator)

This file brings all the components together. The `MPCWallet::sign_message` function is the most critical part of the PoC.

### 5.1. The (Incomplete) MPC Protocol

The functions `generate_key_pair` and `sign_message` use the `multi-party-ecdsa` library. However, they only execute the very first step of the protocol for each party locally.

```rust
// Simplified example from generate_key_pair for Party One
let (_party_one_first_message, _comm_witness, ec_key_pair_party1) = 
    party_one::KeyGenFirstMsg::create_commitments();

// ... then the result is immediately encrypted and saved.
```

**This is the single biggest limitation of the PoC.** A real MPC protocol involves multiple rounds of communication, where parties exchange messages, perform zero-knowledge proofs, and collaboratively compute the result. This PoC **completely omits** this interaction.

### 5.2. Security Improvements from Gemini Review

Based on the first Gemini review, two key improvements were made:

1.  **Forced Token Validation**: The `sign_message` function now requires an `AuthorizationToken` as an argument and calls `auth_token.is_valid()`.

    ```rust
    // In sign_message
    println!("  ├─ 🔒 验证授权令牌...");
    if !auth_token.is_valid() {
        anyhow::bail!("授权令牌已过期或无效");
    }
    ```

2.  **Secure Memory Wiping**: The decrypted key share is wrapped in a `SensitiveData` struct that uses the `zeroize` crate. When this struct goes out of scope, its memory is automatically overwritten with zeros, mitigating the risk of sensitive data remaining in memory.

    ```rust
    // In sign_message
    let sensitive_data = SensitiveData::new(decrypted_data);
    // ... use data ...
    drop(sensitive_data); // Memory is zeroized on drop
    ```

---

## 6. From PoC to Production: A Checklist

This guide and the accompanying code should be seen as a starting point for research. To turn this PoC into a production-worthy system, a significant engineering effort is required. The following checklist, derived from the Gemini reviews, outlines the critical next steps.

| Category | Task | Status in PoC |
| :--- | :--- | :--- |
| **MPC Protocol** | Implement full, interactive $t$-of-$n$ MPC protocol (e.g., FROST). | ❌ **Not Started** |
| **Hardware Security** | Store Kyber private key and Policy Engine key in an HSM. | ❌ **Not Started** |
| **Network Layer** | Build a secure mTLS communication channel between all services. | ❌ **Not Started** |
| **State Management** | Use a transactional database for policy state and MPC protocol state. | ❌ **Not Started** |
| **Cryptography** | Implement HKDF for key derivation. | ❌ **Not Started** |
| **Token Security** | Bind Authorization Token to transaction hash and implement consumption. | ❌ **Not Started** |
| **Auditing** | Implement an immutable, cryptographically-chained audit log. | ❌ **Not Started** |
| **Configuration** | Implement a signed, version-controlled configuration management system. | ❌ **Not Started** |

## 7. Conclusion

Protocol Bank is an experiment in combining several advanced security concepts. The process of building it and subjecting it to automated, rigorous review has been as valuable as the final code itself. It demonstrates that while the high-level architecture may be sound, the devil is truly in the implementation details. We encourage developers and researchers to use this project as a learning tool to explore these concepts further, while remaining acutely aware of the gap that lies between a compelling concept and a secure, secure, production-grade reality.
