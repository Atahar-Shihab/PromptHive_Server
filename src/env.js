import "dotenv/config";

const devSecret = "dev-only-secret-change-me-please-1234567890";

function numberFromEnv(key, fallback) {
  const value = Number(process.env[key] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  SERVER_URL: process.env.SERVER_URL ?? "http://localhost:5000",
  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/prompthive",
  MONGODB_DB: process.env.MONGODB_DB ?? "prompthive",
  MONGODB_CONNECT_RETRIES: Math.min(Math.max(numberFromEnv("MONGODB_CONNECT_RETRIES", 5), 1), 10),
  MONGODB_CONNECT_RETRY_DELAY_MS: Math.min(Math.max(numberFromEnv("MONGODB_CONNECT_RETRY_DELAY_MS", 1500), 250), 10000),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? process.env.SERVER_URL ?? "http://localhost:5000",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? devSecret,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  PREMIUM_PRICE_USD: Number(process.env.PREMIUM_PRICE_USD ?? 5),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME ?? "PromptHive Admin",
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "admin@demo.com",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? "admin1234"
};

export function assertProductionEnv() {
  if (env.NODE_ENV !== "production") return;

  const required = [
    "MONGODB_URI",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "CLIENT_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "STRIPE_SECRET_KEY"
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
}
