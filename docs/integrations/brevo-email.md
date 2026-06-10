# Brevo Email Integration

Atlas ERP uses [Brevo](https://www.brevo.com/) (formerly Sendinblue) as its primary transactional email provider. It is used for sending welcome emails, password reset links, workspace invitations, and invoice notifications.

## Why Brevo?

Brevo offers a generous free tier (300 emails/day), an excellent developer API, and reliable deliverability, making it perfect for transactional ERP emails.

## Configuration Steps

### 1. Create a Brevo Account
Sign up for an account at brevo.com.

### 2. Verify Your Sender Domain/Email
1. In the Brevo dashboard, go to **Senders, Domains, and Dedicated IPs**.
2. Add the email address you want to send emails from (e.g., `noreply@yourdomain.com`).
3. Follow the instructions to verify ownership (usually clicking a link sent to that email or adding DNS records).

### 3. Get API Key
1. Click on your profile dropdown and select **SMTP & API**.
2. Go to the **API Keys** tab.
3. Click **Generate a new API key**. Name it "Atlas ERP Backend".

### 4. Set Environment Variables
Add the key and sender details to `apps/api/.env`:

```bash
BREVO_API_KEY="xkeysib-your-long-api-key-here"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Atlas ERP"
```

## How It Works in Atlas

Email sending is handled asynchronously via the `QueueModule`.

1. The `EmailService` (`apps/api/src/common/services/email.service.ts`) provides methods like `sendWelcomeEmail`.
2. Calling this method does **not** send the email immediately. Instead, it adds a job to the Redis `email` queue.
3. The `EmailProcessor` (`apps/api/src/common/queues/email/email.processor.ts`) picks up the job in the background.
4. The processor compiles the HTML template (located in `apps/api/templates/emails/`) and uses the Brevo Node.js SDK to dispatch the email.

This asynchronous architecture ensures that API response times remain fast, even if the Brevo API is temporarily slow.