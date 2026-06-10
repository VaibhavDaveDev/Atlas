# Troubleshooting

This guide addresses common issues you might encounter while setting up or running Atlas ERP.

## General Issues

### Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::3000` or `:::3001`
**Solution:** Another application is already using the required port. You can either stop that application or change the port Atlas ERP uses by modifying the `.env` file for the respective app (`apps/web/.env` or `apps/api/.env`).

### "pnpm: command not found"
**Error:** `bash: pnpm: command not found`
**Solution:** Install pnpm globally using npm: `npm install -g pnpm@11.1.2`.

## Database Issues

### Database Connection Refused
**Error:** `PrismaClientInitializationError: Can't reach database server at localhost:5432`
**Solution:** 
1. Ensure your PostgreSQL server is running.
2. Verify that the `DATABASE_URL` in `apps/api/.env` is correct.
3. If using Docker, ensure the container is up (`docker ps`).

### Prisma Push/Migrate Fails
**Error:** Various errors when running `pnpm db:push` or `pnpm db:migrate`.
**Solution:** 
1. Check database credentials.
2. Ensure the database user has the necessary permissions to create tables and schemas.
3. If the database schema is out of sync and you are in development, you can reset the database using `pnpm prisma migrate reset` (Warning: This will delete all data).

## Application Errors

### Missing Environment Variables
**Error:** Application crashes on startup complaining about undefined variables.
**Solution:** Double-check that you have copied the `.env.example` files to `.env` in both `apps/api` and `apps/web`, and that all required values are filled out. See [Environment Variables](environment-variables.md) for a complete list.

### Authentication Failures
**Issue:** Cannot log in or sign up.
**Solution:**
1. Check that `BETTER_AUTH_SECRET` is set correctly in `apps/api/.env`.
2. Ensure `BETTER_AUTH_URL` is set to your backend API URL (e.g., `http://localhost:3001`).
3. Verify that your frontend is pointing to the correct API URL via `NEXT_PUBLIC_API_URL` in `apps/web/.env`.
4. Ensure Redis is running, as Better Auth may use it for session management or rate limiting.

### Email Not Sending
**Issue:** Registration or password reset emails are not received.
**Solution:**
1. Verify `BREVO_API_KEY` is correct.
2. Ensure `EMAIL_FROM` is a verified sender address in your Brevo account.
3. Check the backend logs for specific SMTP/Brevo API errors.

### Turnstile (CAPTCHA) Fails Locally
**Issue:** Cannot submit forms due to CAPTCHA validation failure in local development.
**Solution:** 
When creating your Cloudflare Turnstile widget, ensure you add `localhost` and `127.0.0.1` to the allowed domains for testing purposes, or use the dummy test keys provided by Cloudflare for local development.

## Further Help

If your issue is not listed here, please:
1. Check the server logs (both frontend and backend) for detailed error traces.
2. Search the [GitHub Issues](https://github.com/VaibhavDaveDev/Atlas/issues) to see if someone else has encountered the same problem.
3. Open a new issue with a detailed description of the problem, your environment, and the error logs.