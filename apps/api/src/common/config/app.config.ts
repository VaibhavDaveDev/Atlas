import "dotenv/config";

interface AppConfig {
  jwt_access_secret: string;
  jwt_refresh_secret: string;
  redis_cache_key_prefix: string;
  node_env: string;
  port: number;
  // Brevo transactional email
  brevo_api_key: string;
  email_from: string;
  email_from_name: string;
  // Google OAuth
  google_client_id: string;
  google_client_secret: string;
  google_redirect_uri: string;
  web_url: string;
}

const isProd = process.env.NODE_ENV === "production";

const config: AppConfig = {
  jwt_access_secret:
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "",
  jwt_refresh_secret:
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "",
  redis_cache_key_prefix: process.env.REDIS_CACHE_KEY_PREFIX || "app",
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  // Brevo — replaces Mailtrap/nodemailer SMTP
  brevo_api_key: process.env.BREVO_API_KEY || "",
  email_from: process.env.EMAIL_FROM || "noreply@atlas-erp.com",
  email_from_name: process.env.EMAIL_FROM_NAME || "Atlas ERP",
  // Google OAuth
  google_client_id: process.env.GOOGLE_CLIENT_ID || "",
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
  google_redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
  web_url: process.env.WEB_URL || "http://localhost:3000",
};

export default config;
