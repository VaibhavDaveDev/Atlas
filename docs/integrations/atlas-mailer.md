# Atlas Mailer Integration

The `atlas-mailer` is a decoupled microservice designed to handle email dispatching via Gmail SMTP. It runs on Cloudflare Workers and provides a secure, rate-limited API for sending emails.

## Features

- **Decoupled Architecture**: Email logic is isolated from the main API.
- **Rate Limiting**: Enforces a strict limit of 500 emails per day (tracked via Cloudflare KV).
- **Secure**: Authenticates incoming requests via a Bearer token.
- **Gmail SMTP**: Uses Nodemailer with Gmail's SMTP servers.

## Configuration

To use the `atlas-mailer` as your email provider in the main Atlas API, update your environment variables.

### Environment Variables (`apps/api/.env`)

```bash
# Set provider to atlas-mailer
EMAIL_PROVIDER=atlas-mailer

# Microservice details
ATLAS_MAILER_URL=https://atlas-mailer.your-subdomain.workers.dev
ATLAS_MAILER_API_KEY=your-secure-api-key
```

## How it works

1. The main Atlas API `EmailService` detects that `EMAIL_PROVIDER` is set to `atlas-mailer`.
2. Instead of sending emails directly via SMTP or Brevo, it makes a `POST /send` request to the `atlas-mailer` URL.
3. The request includes the `Authorization` header with the `API_KEY`.
4. The `atlas-mailer` microservice:
    - Validates the API key.
    - Checks the daily quota in Cloudflare KV.
    - Sends the email using Gmail SMTP.
    - Increments the daily usage counter.

## Repository

The source code for the microservice can be found at:
[https://github.com/VaibhavDaveDev/atlas-mailer](https://github.com/VaibhavDaveDev/atlas-mailer)

## Local Development

If you want to run the mailer locally for testing:

1. Clone the repo: `git clone https://github.com/VaibhavDaveDev/atlas-mailer.git`
2. Install dependencies: `pnpm install`
3. Create `.dev.vars` with your Gmail credentials and API key.
4. Run locally: `pnpm run dev`
5. Update `ATLAS_MAILER_URL` in the main API to `http://localhost:8787`.
