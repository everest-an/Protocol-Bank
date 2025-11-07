# Netting Engine - Backend Implementation

## Overview

The Netting Engine is the core off-chain component of Protocol Bank's global clearing network. It collects trade instructions, calculates net positions, signs them, and submits them to the `ClearingHouse.sol` smart contract for final settlement.

---

## Architecture

```
Trade Instructions → API → Database → Netting Calculator → Signature Service → ClearingHouse.sol
                                    ↑
                            Cron Scheduler (Hourly)
```

---

## Components

### Models

- **Trade** (`src/models/netting-engine/Trade.js`): Represents a trade instruction
- **SettlementBatch** (`src/models/netting-engine/SettlementBatch.js`): Represents a settlement batch with net positions
- **Participant** (`src/models/netting-engine/Participant.js`): Caches participant information

### Services

- **NettingCalculator** (`src/services/netting-engine/NettingCalculator.js`): Calculates net positions from trades
- **SignatureService** (`src/services/netting-engine/SignatureService.js`): Signs net positions using ECDSA
- **SettlementCoordinator** (`src/services/netting-engine/SettlementCoordinator.js`): Orchestrates the settlement process

### Workers

- **settlementWorker** (`src/workers/settlementWorker.js`): Cron job that runs hourly settlement

---

## API Endpoints

### Trade Management

#### Submit Trade
```http
POST /api/v1/netting-engine/trades
Authorization: Bearer <token>

{
  "tradeId": "uuid",
  "payerAddress": "0x...",
  "receiverAddress": "0x...",
  "amount": "1000.00",
  "currency": "USDC"
}
```

#### Get Trade
```http
GET /api/v1/netting-engine/trades/:tradeId
Authorization: Bearer <token>
```

#### Get Trade Statistics
```http
GET /api/v1/netting-engine/trades/statistics
Authorization: Bearer <token>
```

### Batch Management

#### Get Recent Batches
```http
GET /api/v1/netting-engine/batches?limit=10&offset=0
Authorization: Bearer <token>
```

#### Get Batch by ID
```http
GET /api/v1/netting-engine/batches/:batchId
Authorization: Bearer <token>
```

#### Get Batch Statistics
```http
GET /api/v1/netting-engine/batches/statistics
Authorization: Bearer <token>
```

### Settlement Operations (Admin Only)

#### Trigger Manual Settlement
```http
POST /api/v1/netting-engine/settlement/trigger
Authorization: Bearer <token>

{
  "windowStart": "2025-11-08T00:00:00Z",
  "windowEnd": "2025-11-08T01:00:00Z"
}
```

#### Settle Batch On-Chain
```http
POST /api/v1/netting-engine/batches/:batchId/settle
Authorization: Bearer <token>
```

### Participant Management

#### Get All Participants
```http
GET /api/v1/netting-engine/participants
Authorization: Bearer <token>
```

#### Register Participant
```http
POST /api/v1/netting-engine/participants
Authorization: Bearer <token>

{
  "address": "0x...",
  "name": "Bank A"
}
```

---

## Database Setup

Run the migration to create the necessary tables:

```bash
psql -U postgres -d protocol_bank -f migrations/20251108_create_netting_engine_tables.sql
```

---

## Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.netting-engine.example .env
```

Required environment variables:

- `ETHEREUM_RPC_URL` or `SEPOLIA_RPC_URL`: Ethereum node RPC endpoint
- `NETTING_ENGINE_PRIVATE_KEY`: Private key for signing (DO NOT COMMIT!)
- `CLEARING_HOUSE_ADDRESS`: Deployed ClearingHouse contract address

---

## Running the Netting Engine

The netting engine is integrated into the main backend server. Simply start the server:

```bash
npm start
```

The settlement worker will automatically run hourly at minute 0 (e.g., 1:00, 2:00, 3:00).

---

## Testing

### Manual Settlement Test

You can trigger a manual settlement for testing:

```bash
curl -X POST http://localhost:3001/api/v1/netting-engine/settlement/trigger \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Submit Test Trade

```bash
curl -X POST http://localhost:3001/api/v1/netting-engine/trades \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payerAddress": "0x...",
    "receiverAddress": "0x...",
    "amount": "100.00"
  }'
```

---

## Security Considerations

1. **Private Key Management**: Store `NETTING_ENGINE_PRIVATE_KEY` in a secure vault (AWS KMS, HashiCorp Vault)
2. **Access Control**: Settlement endpoints should be restricted to admin users only
3. **Zero-Sum Validation**: The netting calculator enforces zero-sum constraint
4. **Signature Verification**: ClearingHouse.sol verifies all signatures on-chain

---

## Monitoring

Key metrics to monitor:

- Trade submission rate
- Settlement success rate
- Average settlement time
- Failed settlements
- Net position calculation errors

---

## Troubleshooting

### Settlement Fails

Check the logs for error messages:

```bash
tail -f logs/settlement.log
```

Common issues:
- Insufficient gas
- Invalid signature
- Net positions don't sum to zero
- ClearingHouse contract not configured

### Database Connection Issues

Verify database connection:

```bash
psql -U postgres -d protocol_bank -c "SELECT COUNT(*) FROM trades;"
```

---

## Future Enhancements

- [ ] Multi-currency support
- [ ] Real-time settlement monitoring dashboard
- [ ] Automatic retry mechanism for failed settlements
- [ ] Integration with external clearing networks (CHIPS, TARGET2)
- [ ] Performance optimization for high-volume scenarios

---

## References

- [ClearingHouse.sol Design Document](../../docs/design/CLEARING_HOUSE_DESIGN.md)
- [Netting Engine Design Document](../../docs/design/NETTING_ENGINE_DESIGN.md)
- [Deployment Guide](../../docs/developer/CLEARING_HOUSE_DEPLOYMENT.md)
