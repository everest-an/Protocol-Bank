# Protocol Bank API Documentation

**Version**: 1.0  
**Last Updated**: 2025-11-14  
**Author**: Manus AI

---

## 🚀 Introduction

This document provides a comprehensive overview of the Protocol Bank RESTful API. The API allows you to programmatically manage payments, automate workflows, and access financial data.

### Base URL

```
https://api.protocolbank.com/v1
```

### Authentication

All API requests must be authenticated using a Bearer token in the `Authorization` header.

```http
Authorization: Bearer <YOUR_API_KEY>
```

API keys can be generated in the developer settings of your Protocol Bank account.

---

## 📦 API Endpoints

### Authentication

#### `POST /auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

**Response:**

```json
{
  "token": "ey...",
  "user": {
    "id": 1,
    "walletAddress": "0x..."
  }
}
```

### Stream Payments

#### `GET /streams`

Retrieves a list of stream payments.

**Query Parameters:**

- `status` (string): Filter by status (`active`, `paused`, `completed`, `cancelled`)
- `recipient` (string): Filter by recipient address
- `sender` (string): Filter by sender address

**Response:**

```json
[
  {
    "id": 1,
    "streamId": "0x...",
    "senderAddress": "0x...",
    "recipientAddress": "0x...",
    "amount": "1000000000000000000",
    "status": "active"
  }
]
```

#### `POST /streams`

Creates a new stream payment.

**Request Body:**

```json
{
  "recipientAddress": "0x...",
  "tokenAddress": "0x...",
  "amount": "1000000000000000000",
  "startTime": "2025-12-01T00:00:00Z",
  "endTime": "2026-12-01T00:00:00Z"
}
```

### Batch Payments

#### `POST /batch-payments`

Creates a new batch payment.

**Request Body:**

```json
{
  "useX402": true,
  "payments": [
    {
      "recipientAddress": "0x...",
      "amount": "1000000"
    },
    {
      "recipientAddress": "0x...",
      "amount": "2000000"
    }
  ]
}
```

### Analytics

#### `GET /analytics/summary`

Retrieves a summary of financial data.

**Response:**

```json
{
  "totalIncome": "5000000000",
  "totalExpense": "3000000000",
  "netCashFlow": "2000000000"
}
```

---

## 💡 Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request.

- `200 OK`: The request was successful.
- `201 Created`: The resource was created successfully.
- `400 Bad Request`: The request was invalid.
- `401 Unauthorized`: Authentication failed.
- `404 Not Found`: The requested resource was not found.
- `500 Internal Server Error`: An unexpected error occurred.
