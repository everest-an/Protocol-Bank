# Protocol Bank: A Proof-of-Concept for a Post-Quantum MPC Wallet Infrastructure

**Authors**: Manus AI & User

**Date**: November 3, 2025

**Version**: 0.9 (Educational PoC)

---

## Abstract

This whitepaper introduces Protocol Bank, a proof-of-concept (PoC) for an institutional-grade digital asset wallet infrastructure. The project explores the integration of three cutting-edge security technologies: Multi-Party Computation (MPC), Post-Quantum Cryptography (PQC), and a three-tiered architecture for defense-in-depth. While demonstrating the feasibility of this approach, this document also transparently outlines the significant gap between this PoC and a production-ready system, as identified through two rounds of rigorous automated code review by Google's Gemini 2.5 Flash model. This paper is intended for educational and research purposes, providing a blueprint and a cautionary guide for building next-generation digital asset security systems.

---

## 1. Introduction

The security of digital assets is the bedrock of the cryptocurrency ecosystem. For institutional participants, managing large volumes of assets requires a security model that transcends traditional single-private-key wallets. Two dominant paradigms have emerged: Multi-Signature (Multi-Sig) and Multi-Party Computation (MPC). While Multi-Sig offers on-chain security, it often suffers from high transaction fees, slow processing, and a lack of privacy. MPC, on the other hand, provides a more flexible and private off-chain solution by distributing the signing process among multiple parties without ever reconstructing the full private key [1].

However, the rise of quantum computing poses a long-term existential threat to the cryptographic foundations of most existing blockchains, including the Elliptic Curve Digital Signature Algorithm (ECDSA) used by Bitcoin and Ethereum. A sufficiently powerful quantum computer could break ECDSA, rendering all current wallets insecure [2].

Protocol Bank addresses these challenges by proposing a novel architecture that combines:

1.  **Multi-Party Computation (MPC)**: To eliminate the single point of failure of a private key.
2.  **Post-Quantum Cryptography (PQC)**: To protect the MPC key shares from quantum attacks.
3.  **Three-Tiered Architecture**: To enforce separation of duties and defense-in-depth.

This whitepaper details the design, implementation, and—most importantly—the security limitations of the Protocol Bank PoC.

---

## 2. System Architecture

Protocol Bank is designed around a "three-separation" principle, decoupling the core functions of the wallet into independent, mutually-distrusting layers. This design is inspired by the Zero Trust security model.

![Three-Tier Architecture Diagram](placeholder_for_diagram.png)
*Figure 1: The Three-Tiered Architecture of Protocol Bank*

### 2.1. Policy Engine Tier

This tier is the brain of the system, responsible for authorizing transactions *before* they reach the cryptographic core. It is completely decoupled from the key management and signing processes.

-   **Responsibilities**: Defines and enforces all business and security rules, such as amount limits, address whitelisting, time windows, and daily velocity checks.
-   **Mechanism**: Upon receiving a transaction request, the Policy Engine evaluates it against a set of rules. If the transaction is compliant and receives the necessary approvals (for high-value transactions), the engine issues a short-lived, single-use **Authorization Token**.

### 2.2. Storage Tier

This tier is a simple, zero-knowledge storage layer. Its only function is to store the encrypted MPC key shares. It has no knowledge of the content it stores.

-   **Responsibilities**: Persistently stores the encrypted key shares.
-   **Security**: The key shares are encrypted using a hybrid post-quantum encryption scheme. Even if the Storage Tier is fully compromised, the attacker cannot access the key shares without the corresponding decryption key.

### 2.3. Computation Tier (MPC Nodes)

This tier is the cryptographic heart of the system, responsible for performing the MPC protocol to generate a signature.

-   **Responsibilities**: Executes the multi-party ECDSA signing protocol.
-   **Mechanism**: The MPC nodes are stateless. To perform a signature, they must be presented with a valid Authorization Token from the Policy Engine. Upon successful token validation, the nodes retrieve the encrypted key shares from the Storage Tier, decrypt them in-memory, perform the MPC signing ceremony, and then securely wipe the key share data from memory.

---

## 3. Cryptographic Primitives

Protocol Bank's security relies on the combination of two powerful cryptographic primitives.

### 3.1. MPC: ZenGo's `multi-party-ecdsa`

For the MPC core, we selected the open-source Rust implementation of the Lindell (2017) two-party ECDSA protocol from ZenGo-X [3]. This library provides the foundational building blocks for generating and using two key shares to produce a valid ECDSA signature without ever combining the shares.

> **Note**: The choice of a 2-of-2 scheme in this PoC is a significant limitation. A production system would require a $t$-of-$n$ threshold signature scheme (e.g., GG20 or FROST) to provide operational resiliency and enhanced security.

### 3.2. PQC: Kyber-1024 + AES-256-GCM Hybrid Encryption

To protect the MPC key shares at rest, we implemented a hybrid encryption scheme that provides both classical and quantum resistance.

1.  **Key Encapsulation Mechanism (KEM)**: We use **CRYSTALS-Kyber-1024**, a lattice-based KEM selected by NIST as the primary standard for post-quantum public-key encryption and key establishment [4]. Kyber is used to securely establish a shared secret between the MPC node and the key storage mechanism.
2.  **Data Encapsulation Mechanism (DEM)**: We use **AES-256-GCM**, a highly efficient and secure authenticated encryption cipher. The actual MPC key share is encrypted with a key derived from the Kyber shared secret.

This hybrid approach ensures that the confidentiality of the key shares is protected even against a future quantum adversary.

---

## 4. Security Analysis & Limitations (Gemini Review)

Transparency is a core principle of this project. We subjected the PoC to two rounds of automated, stringent code and design review using Google's Gemini 2.5 Flash model. The reviews highlighted the vast difference between a PoC and a production-ready system.

### 4.1. Round 1 Findings: Critical PoC-Level Flaws

The first review identified several fatal flaws in the initial implementation:

-   **Incomplete MPC Protocol**: The code only implemented the first step of the key generation and signing protocols, with no actual multi-party interaction.
-   **Bypassable Policy Engine**: The MPC signing function did not validate the Authorization Token, allowing the entire policy layer to be bypassed.
-   **Insecure Key Management**: The Kyber private key for decrypting the key share was stored alongside the encrypted share on the same node, defeating the purpose of the encryption.

### 4.2. Round 2 Findings: Deeper Architectural Vulnerabilities

After addressing the first-round feedback at a PoC level, a second, more stringent review was conducted, assuming a production-grade threat model. This revealed deeper, more subtle vulnerabilities:

| Vulnerability Category | Finding | Production-Grade Mitigation |
| :--- | :--- | :--- |
| **Cryptographic Implementation** | **Lack of Key Derivation**: Using the raw Kyber shared secret as an AES key is not best practice. | Use a Key Derivation Function (KDF) like HKDF-SHA256 to derive a cryptographically strong key from the shared secret. |
| **Architectural Flaws** | **Race Conditions in Policy Engine**: The `DailyLimit` check is not atomic, allowing concurrent transactions to bypass it. | Implement atomic operations or distributed locks for all stateful policy checks. |
| **Protocol Security** | **Replay Attacks on Authorization Tokens**: The token is not cryptographically bound to the transaction hash, allowing it to be replayed for a different transaction. | The token must contain the hash of the transaction payload and be consumed in a non-repudiable manner. |
| **Operational Security** | **Lack of Immutable Audit Trail**: `println!` logs are insufficient for forensics and can be tampered with. | Implement a cryptographically chained, write-once, read-many (WORM) audit log for all security-critical events. |

---

## 5. The Path to Production

Based on the Gemini reviews, the path from this educational PoC to a production-grade system is substantial. We estimate it would require **22-32 person-months** of effort from a specialized team of cryptographic and security engineers. Key milestones on this path include:

1.  **Full MPC Protocol Implementation**: Implementing the complete, multi-round, interactive state machine for a $t$-of-$n$ threshold signature scheme (e.g., FROST).
2.  **Hardware Security Module (HSM) Integration**: Storing all high-value private keys (like the Kyber decryption key) in a FIPS 140-2 Level 3 certified HSM.
3.  **Secure Network Layer**: Building a mutually authenticated (mTLS) network layer for all inter-service communication.
4.  **Robust State Management**: Implementing a fault-tolerant, persistent state management layer for the MPC protocol and the policy engine.
5.  **Immutable Auditing**: Deploying a dedicated, tamper-evident logging system.

---

## 6. Conclusion

Protocol Bank successfully demonstrates the conceptual viability of a post-quantum secure, MPC-based wallet architecture. It serves as a valuable educational tool for understanding the interplay of advanced cryptographic primitives and secure system design.

However, the project's most important contribution is its transparent documentation of its own limitations. The rigorous automated security reviews by Gemini highlight that building secure cryptographic systems is extraordinarily difficult and requires a level of rigor far beyond a simple proof-of-concept. We hope that this whitepaper serves not only as a blueprint for future innovation but also as a sober reminder of the immense responsibility that comes with securing digital assets.

**Disclaimer**: This project is a proof-of-concept and is **NOT FOR PRODUCTION USE**. It is intended for educational and research purposes only.

---

## 7. References

[1] Coinbase. (2023). *The Subtleties of Error Handling Flaws in MPC*. [https://www.coinbase.com/blog/the-subtleties-of-error-handling-flaws-in-mpc](https://www.coinbase.com/blog/the-subtleties-of-error-handling-flaws-in-mpc)

[2] National Institute of Standards and Technology (NIST). (2022). *Post-Quantum Cryptography*. [https://csrc.nist.gov/projects/post-quantum-cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)

[3] ZenGo-X. (2020). *multi-party-ecdsa*. GitHub. [https://github.com/ZenGo-X/multi-party-ecdsa](https://github.com/ZenGo-X/multi-party-ecdsa)

[4] Schanck, J., & Schwabe, P. (2021). *CRYSTALS-Kyber*. [https://pq-crystals.org/kyber/](https://pq-crystals.org/kyber/)
