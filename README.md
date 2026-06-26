# PromptHive Server

Express.js JavaScript API for the AI Prompt Sharing & Marketplace Platform.

## Key Packages

Express, MongoDB, Mongoose, Better Auth, Google OAuth, JWT/Bearer plugins, Stripe, Multer, OpenAI, Gemini SDK, Zod.

## Run

```bash
npm install
copy ".env.example" ".env"
npm run seed
npm run dev
```

Set MongoDB, Better Auth, Google, Stripe, and optional AI provider credentials in `.env`.
MongoDB startup retries are enabled by default with `MONGODB_CONNECT_RETRIES=5` and `MONGODB_CONNECT_RETRY_DELAY_MS=1500`, which helps cold Atlas/backend deployments recover before the server exits.

Server URL: add your deployed backend URL here.
