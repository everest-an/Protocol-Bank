# Contributing to Protocol Bank

First off, thank you for considering contributing to Protocol Bank! It's people like you that make open source such a great community.

## Where to Start

- **Issues**: Check the [issues tab](https://github.com/everest-an/Protocol-Bank/issues) for bugs, feature requests, or tasks.
- **Discussions**: Join the [discussions](https://github.com/everest-an/Protocol-Bank/discussions) to share ideas or ask questions.

## How to Contribute

1.  **Fork the repository**
2.  **Create a new branch**: `git checkout -b feature/your-feature-name`
3.  **Make your changes**
4.  **Commit your changes**: `git commit -m 'feat: Add some feature'`
5.  **Push to your branch**: `git push origin feature/your-feature-name`
6.  **Create a pull request**

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm
- Docker (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/everest-an/Protocol-Bank.git
cd Protocol-Bank

# Install dependencies
pnpm install

# Set up environment variables
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env
cp contracts/ethereum/.env.example contracts/ethereum/.env
```

### Running the Application

```bash
# Start the database
docker-compose up -d

# Run the backend
pnpm --filter backend dev

# Run the frontend
pnpm --filter frontend dev
```

## Coding Style

- **JavaScript**: We use Prettier for code formatting. Run `pnpm format` before committing.
- **Git Commits**: We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  Increase the version numbers in any examples and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4.  You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.
