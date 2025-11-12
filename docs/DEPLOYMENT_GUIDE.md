# Protocol Bank - Deployment Guide

This document outlines the deployment architecture and process for Protocol Bank.

## 1. System Architecture

Protocol Bank uses a modern, containerized architecture with a monorepo structure, deployed on AWS and managed via GitHub Actions.

### 1.1. Core Components

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express.js + PostgreSQL + Redis
- **Blockchain**: Hardhat + Ethers.js (deployed on Sepolia testnet)
- **CI/CD**: GitHub Actions
- **Hosting**: AWS EC2
- **Containerization**: Docker

### 1.2. Monorepo Structure

The project is managed as a pnpm monorepo with the following key packages:

- `apps/frontend`: The main user-facing web application.
- `apps/backend`: The core API and business logic.
- `apps/admin`: The administrative dashboard.
- `packages/ui`: Shared UI components.
- `packages/config`: Shared configuration files.

## 2. Deployment Process

Deployment is fully automated via GitHub Actions. Any push to the `main` branch triggers the deployment workflow.

### 2.1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

The workflow consists of three main jobs:

1. **`test`**: 
   - Sets up a PostgreSQL container for testing.
   - Installs backend dependencies (`npm ci`).
   - Initializes the test database (this step can be skipped if SQL files are missing).
   - Runs backend tests (`npm test`).
   - Installs frontend dependencies (`pnpm install --frozen-lockfile`).
   - Builds the frontend application (`pnpm --filter frontend build`).

2. **`build-and-push`**:
   - Depends on the `test` job.
   - Builds Docker images for both the frontend and backend.
   - Pushes the images to Docker Hub.

3. **`deploy`**:
   - Depends on the `build-and-push` job.
   - Connects to the AWS EC2 instance via SSH.
   - Pulls the latest Docker images from Docker Hub.
   - Restarts the services using `docker-compose`.

### 2.2. AWS Server Setup

The AWS EC2 instance is configured with:

- Docker and Docker Compose
- Nginx as a reverse proxy
- A `docker-compose.yml` file in `/opt/protocol-bank` to manage the application containers.

### 2.3. Manual Deployment (Emergency)

If the automated deployment fails, you can deploy manually:

1. **SSH into the AWS server**:
   ```bash
   ssh -i <your-key.pem> <user>@<host>
   ```

2. **Navigate to the project directory**:
   ```bash
   cd /opt/protocol-bank
   ```

3. **Pull the latest images**:
   ```bash
   docker-compose pull
   ```

4. **Restart the services**:
   ```bash
   docker-compose up -d
   ```

## 3. Troubleshooting

- **Deployment Failure**: Check the GitHub Actions logs for the specific error. Common issues include test failures, build errors, or Docker Hub authentication problems.
- **Application Not Responding**: SSH into the server and check the container logs using `docker-compose logs -f`.
- **Analytics Page Not Loading**: This was a known issue caused by a CI/CD configuration problem. It has been resolved by fixing the package manager commands in the workflow.

---
*This document was last updated on November 13, 2025 by Manus AI.*
