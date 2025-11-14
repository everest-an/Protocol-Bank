# Protocol Bank System Architecture

**Version**: 1.0  
**Last Updated**: 2025-11-14  
**Author**: Manus AI

---

## 1. Introduction

This document outlines the system architecture of Protocol Bank, a decentralized payment management platform. It covers the frontend, backend, smart contracts, and the interactions between them.

## 2. High-Level Architecture

The system is composed of three main layers:

1.  **Frontend**: A React-based single-page application (SPA) that provides the user interface.
2.  **Backend**: A Node.js/Express server that handles business logic, data storage, and communication with the blockchain.
3.  **Smart Contracts**: Solidity contracts deployed on the Ethereum blockchain that manage the core payment logic.

```mermaid
graph TD
    A[User] --> B{Frontend (React)};
    B --> C{Backend (Node.js)};
    C --> D[Database (PostgreSQL)];
    C --> E{Blockchain (Ethereum)};
    B --> E;
```

## 3. Frontend Architecture

### 3.1 Technology Stack

- **Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useContext)
- **Routing**: React Router
- **Web3 Interaction**: ethers.js

### 3.2 Component Structure

- **`pages`**: Top-level components for each page (e.g., `StreamPaymentPage.jsx`).
- **`components`**: Reusable UI components (e.g., `Button.jsx`, `Modal.jsx`).
- **`hooks`**: Custom React hooks for shared logic (e.g., `useWeb3Wallet.js`).
- **`services`**: Modules for interacting with the backend and external APIs.
- **`utils`**: Utility functions for formatting, validation, etc.

### 3.3 Data Flow

1.  **User Interaction**: The user interacts with a component.
2.  **State Update**: The component updates its state.
3.  **API Call**: The component calls a service to fetch or send data.
4.  **UI Re-render**: The component re-renders with the new data.

## 4. Backend Architecture

### 4.1 Technology Stack

- **Framework**: Node.js, Express
- **Database**: PostgreSQL
- **ORM**: (None, using raw SQL)
- **Authentication**: JWT

### 4.2 API Structure

- **`routes`**: Define the API endpoints.
- **`controllers`**: Handle the request and response logic.
- **`services`**: Contain the business logic.
- **`middleware`**: Handle authentication, logging, etc.

### 4.3 Database Schema

The database schema is designed to store user data, payment information, and transaction history. Key tables include:

- `users`
- `stream_payments`
- `batch_payments`
- `transactions`

## 5. Smart Contract Architecture

### 5.1 Contracts

- **`X402BatchSettlement.sol`**: Implements the X402 protocol for batch payments.
- **`StreamPayment.sol`**: Manages the creation and lifecycle of stream payments.

### 5.2 Interaction

The frontend and backend interact with the smart contracts via the ethers.js library. The backend uses a relayer wallet to pay for Gas fees in certain scenarios.

---

## 6. Deployment

- **Frontend**: Deployed as a static site on Vercel or Netlify.
- **Backend**: Deployed as a Node.js application on a cloud provider like AWS or Railway.
- **Database**: Hosted on a managed PostgreSQL service.
- **Smart Contracts**: Deployed to the Ethereum network using Hardhat.
