# MPC Wallet Deployment Guide

**Version**: 2.1.0 (Production-Ready)
**Last Updated**: November 3, 2025

---

## 1. Overview

This guide provides comprehensive instructions for deploying the MPC Wallet system in a production environment. Two deployment methods are supported:

1.  **Bare Metal / VM Deployment**: Using a shell script for traditional server setups.
2.  **Containerized Deployment**: Using Docker and Docker Compose for a modern, isolated environment.

**Recommendation**: For most production scenarios, the **Containerized Deployment** is highly recommended due to its portability, scalability, and isolation benefits.

---

## 2. Prerequisites

### 2.1. System Requirements

- **OS**: Ubuntu 22.04 LTS or a recent Debian-based Linux distribution.
- **CPU**: 2+ cores (4+ recommended for production).
- **RAM**: 4GB+ (8GB+ recommended for production).
- **Disk**: 20GB+ free space for the application, logs, and audit data.
- **Network**: Stable network connection with low latency between MPC nodes.

### 2.2. Required Software

- **For Bare Metal**: `git`, `build-essential`, `libgmp-dev`, `protobuf-compiler`, `libssl-dev`, `curl`.
- **For Containerized**: `git`, `docker`, `docker-compose`.

---

## 3. Bare Metal / VM Deployment

This method uses the `deploy.sh` script to set up the MPC Wallet as a `systemd` service on a Linux server.

### 3.1. Deployment Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/everest-an/Protocol-Bank.git
    cd Protocol-Bank/wallet-security/mpc-wallet
    ```

2.  **Run the Deployment Script**

    The script must be run with `sudo` privileges. It will perform the following actions:
    - Install system dependencies.
    - Create a dedicated system user (`mpc-wallet`).
    - Create necessary directories (`/opt/mpc-wallet`, `/etc/mpc-wallet`, etc.).
    - Compile the Rust project in release mode.
    - Install the binary to `/opt/mpc-wallet`.
    - Generate a default configuration file at `/etc/mpc-wallet/config.toml`.
    - Create a `systemd` service file at `/etc/systemd/system/mpc-wallet.service`.
    - Configure firewall rules (if `ufw` is available).

    ```bash
    sudo ./scripts/deploy.sh
    ```

3.  **Configure the Node**

    Edit the configuration file to match your environment. This is a critical step.

    ```bash
    sudo nano /etc/mpc-wallet/config.toml
    ```

    **Key Configuration Options**:
    - `node_id`: A unique identifier for this node (e.g., "node1").
    - `listen_addr`: The address and port for the gRPC server (e.g., "0.0.0.0:50051").
    - `peer_addrs`: A list of gRPC addresses for the other MPC nodes.
    - `hsm.provider`: Configure your HSM provider (e.g., `AWSCloudHSM`, `ThalesLuna`). For testing, `SoftwareSimulation` can be used.

4.  **Start the Service**

    ```bash
    sudo systemctl start mpc-wallet
    ```

5.  **Enable Auto-Start on Boot**

    ```bash
    sudo systemctl enable mpc-wallet
    ```

### 3.2. Managing the Service

- **Check Status**: `sudo systemctl status mpc-wallet`
- **View Logs**: `sudo journalctl -u mpc-wallet -f`
- **Stop Service**: `sudo systemctl stop mpc-wallet`
- **Restart Service**: `sudo systemctl restart mpc-wallet`

### 3.3. Security Hardening

The `systemd` service includes several security hardening options by default (`NoNewPrivileges`, `PrivateTmp`, `ProtectSystem`, etc.). Ensure your firewall is properly configured to only allow traffic from other MPC nodes on the gRPC port.

---

## 4. Containerized Deployment (Recommended)

This method uses Docker and Docker Compose to run the MPC Wallet and its monitoring stack in isolated containers.

### 4.1. Deployment Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/everest-an/Protocol-Bank.git
    cd Protocol-Bank/wallet-security/mpc-wallet
    ```

2.  **Create Configuration Files**

    The `docker-compose.yml` file expects configuration files for each node in the `config/` directory.

    ```bash
    mkdir -p config
    ```

    Create `config/node1.toml`:
    ```toml
    # Configuration for node 1
    [system]
    node_id = "node1"
    
    [network]
    listen_addr = "0.0.0.0:50051"
    peer_addrs = ["mpc-node-2:50051"]
    # ... other settings
    ```

    Create `config/node2.toml`:
    ```toml
    # Configuration for node 2
    [system]
    node_id = "node2"
    
    [network]
    listen_addr = "0.0.0.0:50051"
    peer_addrs = ["mpc-node-1:50051"]
    # ... other settings
    ```

3.  **Build and Start the Containers**

    This command will build the Docker image and start all services defined in `docker-compose.yml` (two MPC nodes, Prometheus, Grafana).

    ```bash
    docker-compose up --build -d
    ```

### 4.2. Managing the Services

- **Check Status**: `docker-compose ps`
- **View Logs**: `docker-compose logs -f mpc-node-1` (or `mpc-node-2`)
- **Stop Services**: `docker-compose down`
- **Restart Services**: `docker-compose restart`

### 4.3. Accessing Services

- **MPC Node 1 gRPC**: `localhost:50051`
- **MPC Node 2 gRPC**: `localhost:50052`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (Default login: `admin`/`admin`)

### 4.4. Data Persistence

Docker volumes are used to persist data for MPC nodes, Prometheus, and Grafana. This ensures that data is not lost when containers are restarted.

- `node1-data`, `node1-logs`
- `node2-data`, `node2-logs`
- `prometheus-data`
- `grafana-data`

To manage these volumes, use `docker volume ls`, `docker volume inspect`, etc.

---

## 5. Monitoring and Alerting

The containerized deployment includes a pre-configured monitoring stack.

### 5.1. Prometheus

- **URL**: `http://localhost:9090`
- **Targets**: Automatically scrapes metrics from both MPC nodes.
- **Alerts**: Pre-configured alert rules in `monitoring/alerts.yml`. An Alertmanager instance is required to receive and route these alerts (not included in the default `docker-compose.yml`).

### 5.2. Grafana

- **URL**: `http://localhost:3000`
- **Login**: `admin` / `admin`
- **Data Source**: Prometheus is pre-configured as the default data source.
- **Dashboards**: You can create dashboards to visualize key metrics, such as:
    - Signing latency (`mpc_signing_duration_seconds`)
    - Transaction throughput (`rate(mpc_transactions_total[5m])`)
    - Error rates (`rate(mpc_errors_total[5m])`)
    - System health (CPU, memory)

---

## 6. Backup and Recovery

Regular backups are critical for disaster recovery.

### 6.1. What to Back Up

1.  **Audit Logs**: The most critical data. Located in the data directory (`/var/lib/mpc-wallet/audit_logs` or the `*-data` Docker volume).
2.  **HSM Keys**: If using a software HSM or a file-based HSM, back up the key material. For hardware HSMs, follow the vendor's backup procedures.
3.  **Configuration Files**: Located at `/etc/mpc-wallet/` or the `config/` directory.

### 6.2. Recovery Procedure

1.  Set up a new server or container environment.
2.  Restore the configuration files.
3.  Restore the HSM keys.
4.  Restore the audit log database.
5.  Start the MPC Wallet service.
6.  Verify the integrity of the restored data.

---

## 7. Security Best Practices

- **Network Segmentation**: Isolate the MPC nodes in a private network. Only allow traffic from trusted sources.
- **Use a Hardware HSM**: Do not use the `SoftwareSimulation` HSM in production.
- **Principle of Least Privilege**: The `mpc-wallet` user and service have limited permissions.
- **Regular Audits**: Regularly audit the system logs and audit trail for suspicious activity.
- **Key Rotation**: Follow the key rotation policy defined in your HSM configuration.
- **Secure Backups**: Encrypt your backups and store them in a secure, off-site location.
