# Getting Started with Atlas ERP

Welcome to the Atlas ERP Getting Started guide! This section will walk you through the process of setting up Atlas ERP on your local machine for development or evaluation purposes.

## What's in this section?

- [Prerequisites](prerequisites.md) — What you need installed before you begin
- [Installation](installation.md) — Step-by-step installation instructions
- [Environment Variables](environment-variables.md) — Configuring the application
- [Running Locally](running-locally.md) — Starting the development servers
- [Deployment](deployment.md) — How to deploy Atlas ERP to production
- [Troubleshooting](troubleshooting.md) — Common issues and their solutions

## Quick Start (Docker)

If you have Docker and Docker Compose installed, you can spin up the required databases (PostgreSQL and Redis) quickly:

```bash
docker-compose up -d
```

This will start PostgreSQL on port `5432` and Redis on port `6379`.

Once the containers are running, you can proceed to the [Installation](installation.md) steps.