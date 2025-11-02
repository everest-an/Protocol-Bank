# MPC Wallet Monitoring & Alerting Guide

**Version**: 2.1.0 (Production-Ready)
**Last Updated**: November 3, 2025

---

## 1. Overview

This guide details the monitoring and alerting capabilities of the MPC Wallet system. The system is designed to be observable, providing deep insights into its health, performance, and security.

The monitoring stack is built on industry-standard tools:

- **Prometheus**: For metrics collection and storage.
- **Grafana**: For metrics visualization and dashboards.
- **Alertmanager**: For handling and routing alerts (requires separate setup).

---

## 2. Key Metrics

The MPC Wallet exposes a rich set of metrics in Prometheus format. These metrics cover four main areas: Business, Performance, Errors, and System Health.

### 2.1. Business Metrics

These metrics provide insights into the core functions of the wallet.

- `mpc_transactions_total{status, type}`: Total number of transactions processed.
  - `status`: `success`, `failed`
  - `type`: `transfer`, `contract_call`
- `mpc_signatures_total{status}`: Total number of MPC signatures created.
  - `status`: `success`, `failed`
- `mpc_policy_violations_total{rule}`: Number of times a policy rule was violated.
  - `rule`: `amount_limit`, `daily_limit`, `whitelist`

### 2.2. Performance Metrics (Latency)

These are histograms that track the duration of critical operations.

- `mpc_signing_duration_seconds_bucket{le}`: MPC signing latency distribution.
- `mpc_policy_evaluation_duration_seconds_bucket{le}`: Policy evaluation latency.
- `mpc_audit_log_write_duration_seconds_bucket{le}`: Audit log write latency.
- `mpc_network_request_duration_seconds_bucket{le, method}`: gRPC request latency.

**Example Query (P95 Signing Latency)**:
```promql
histogram_quantile(0.95, sum(rate(mpc_signing_duration_seconds_bucket[5m])) by (le))
```

### 2.3. Error & Security Metrics

These counters track various types of errors and security-related events.

- `mpc_errors_total{type}`: General error counter.
  - `type`: `cryptographic`, `network`, `io`, `invalid_request`
- `mpc_replay_attacks_detected_total`: Counter for detected replay attacks.
- `mpc_tamper_detected_total`: Counter for detected data tampering (configs, audit logs).
- `mpc_audit_log_write_errors_total`: Errors during audit log writes.
- `mpc_key_operation_errors_total`: Errors during HSM or key operations.
- `mpc_network_errors_total{type}`: Network-related errors.
  - `type`: `timeout`, `connection_refused`

### 2.4. System Health Metrics

These gauges provide a snapshot of the system's current state.

- `mpc_active_sessions`: Number of active MPC sessions.
- `mpc_pending_transactions`: Number of transactions waiting for processing.
- `process_resident_memory_bytes`: Memory usage of the MPC Wallet process.
- `process_cpu_seconds_total`: CPU time consumed by the process.
- `up{job="mpc-node-X"}`: Node health status (1 for up, 0 for down).

---

## 3. Dashboards with Grafana

Grafana is the recommended tool for visualizing the metrics collected by Prometheus.

### 3.1. Setup

- **URL**: `http://localhost:3000` (in the Docker Compose setup)
- **Login**: `admin` / `admin`
- **Data Source**: The Prometheus data source is automatically provisioned.

### 3.2. Recommended Dashboard Panels

Create a new dashboard with the following panels to get a comprehensive overview of the system:

1.  **Key Performance Indicators (KPIs)** (Singlestat)
    - Total Transactions (24h)
    - Success Rate (%)
    - P95 Signing Latency
    - Active MPC Sessions

2.  **Transaction Throughput & Error Rate** (Graph)
    - `rate(mpc_transactions_total{status="success"}[5m])`
    - `rate(mpc_transactions_total{status="failed"}[5m])`

3.  **Signing Latency** (Graph)
    - `histogram_quantile(0.99, sum(rate(mpc_signing_duration_seconds_bucket[5m])) by (le))`
    - `histogram_quantile(0.95, sum(rate(mpc_signing_duration_seconds_bucket[5m])) by (le))`
    - `histogram_quantile(0.50, sum(rate(mpc_signing_duration_seconds_bucket[5m])) by (le))`

4.  **System Health** (Graph)
    - CPU Usage: `rate(process_cpu_seconds_total{job=~"mpc-node-.*"}[5m])`
    - Memory Usage: `process_resident_memory_bytes{job=~"mpc-node-.*"}`

5.  **Security Events** (Graph)
    - `rate(mpc_replay_attacks_detected_total[5m])`
    - `rate(mpc_tamper_detected_total[5m])`
    - `rate(mpc_policy_violations_total[5m])`

6.  **Audit Log** (Graph)
    - `rate(mpc_audit_log_writes_total[5m])`
    - `rate(mpc_audit_log_write_errors_total[5m])`

---

## 4. Alerting with Alertmanager

The `monitoring/alerts.yml` file contains a set of recommended alert rules. To use them, you need to set up an Alertmanager instance.

### 4.1. Critical Alerts (Require Immediate Attention)

- `MPCNodeDown`: An MPC node is offline.
- `AuditLogWriteFailure`: The system cannot write to the audit log, which could lead to data loss.
- `KeyOperationFailure`: Failures during HSM or key operations.
- `ReplayAttackDetected`: A potential replay attack is in progress.
- `TamperDetected`: Data integrity has been compromised.

### 4.2. Warning Alerts (Require Investigation)

- `HighErrorRate`: The rate of errors is unusually high.
- `HighSigningLatency`: MPC signing is taking too long.
- `HighMemoryUsage`: Potential memory leak or overload.
- `HighCPUUsage`: The node is under heavy load.
- `PolicyViolation`: A high number of policy violations are occurring.
- `NetworkCommunicationFailure`: High rate of network errors between nodes.
- `LowDiskSpace`: The disk for logs or data is running out of space.

### 4.3. Alertmanager Setup (Example)

Add Alertmanager to your `docker-compose.yml`:

```yaml
alertmanager:
  image: prom/alertmanager:latest
  container_name: mpc-wallet-alertmanager
  ports:
    - "9093:9093"
  volumes:
    - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
  networks:
    - mpc-network
  restart: unless-stopped
```

You will also need to create `monitoring/alertmanager.yml` to configure alert routing (e.g., to Slack, PagerDuty, or email).

---

## 5. Logging

In addition to metrics, the MPC Wallet produces structured logs.

- **Bare Metal**: Logs are sent to `journald`. Use `journalctl -u mpc-wallet` to view them.
- **Containerized**: Logs are sent to `stdout`/`stderr`. Use `docker-compose logs -f <service_name>` to view them.

It is recommended to forward these logs to a centralized logging platform (e.g., ELK Stack, Splunk, Grafana Loki) for long-term storage, searching, and analysis.
