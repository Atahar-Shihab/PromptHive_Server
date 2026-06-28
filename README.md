<div align="center">

# PromptHive Server

### Express API for authentication, prompts, moderation, payments, uploads, analytics, and premium access.

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-API-111111?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img alt="Better Auth" src="https://img.shields.io/badge/Better_Auth-Sessions-222222?style=for-the-badge" />
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
</p>

<p>
  <a href="https://prompthive-server.onrender.com">Live API</a>
  <span> | </span>
  <a href="https://prompt-hive-client.vercel.app">Frontend</a>
  <span> | </span>
  <a href="https://github.com/Atahar-Shihab/PromptHive_Server">Server Repository</a>
  <span> | </span>
  <a href="https://github.com/Atahar-Shihab/PromptHive_client">Client Repository</a>
</p>

</div>

---

## Overview

PromptHive Server is the backend for a full-stack AI prompt sharing and marketplace platform. It manages Better Auth sessions, Google OAuth, MongoDB prompt data, role-based access, prompt moderation, reviews, bookmarks, reports, Stripe premium payment, file uploads, analytics, notifications, and optional prompt quality testing.

The API is built with Express and MongoDB, and is designed to support three role experiences: user, creator, and admin.

## Live Links

| Item | URL |
| --- | --- |
| Live API | https://prompthive-server.onrender.com |
| Frontend | https://prompt-hive-client.vercel.app |
| Server Repository | https://github.com/Atahar-Shihab/PromptHive_Server |
| Client Repository | https://github.com/Atahar-Shihab/PromptHive_client |

## API Capabilities

| Area | Included |
| --- | --- |
| Authentication | Email/password auth, Google OAuth, Better Auth sessions, JWT/Bearer support |
| Authorization | Middleware for protected routes and admin-only actions |
| Prompts | Create, update, delete, list, detail view, fork, copy count, creator analytics, moderation, and feature toggle |
| Marketplace | Backend search, category/tool/difficulty/access filters, sorting, pagination, featured prompts, and top creators |
| Reviews | Public reviews, own reviews, create/update prompt review, and rating metadata |
| Bookmarks | Toggle saved prompts and list saved prompt library |
| Reports | Submit reports, admin review, warn creator, dismiss report, and remove reported prompt |
| Payments | Stripe payment intent, premium transaction storage, and subscription upgrade |
| Uploads | Multer image upload for prompt thumbnails and profile photos |
| Analytics | MongoDB aggregation for users, prompts, reviews, copies, payments, and creator trends |
| Notifications | Prompt approval/rejection and report-related user notifications |
| Optional AI | OpenAI/Gemini prompt quality testing endpoint with graceful fallback on the client |
| Seed Data | Realistic prompts, creators, reviews, premium prompts, and a demo admin account |

## Role Matrix

| Role | Permissions |
| --- | --- |
| User | Browse approved prompts, save prompts, copy accessible prompts, review, report, submit prompts, and update profile |
| Creator | Publish prompts, manage own prompts, and view creator analytics |
| Admin | Manage users, change roles, approve/reject prompts, feature prompts, inspect payments, resolve reports, and view analytics |

## Tech Stack

| Category | Tools |
| --- | --- |
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB, Mongoose, MongoDB native driver |
| Authentication | Better Auth, Google OAuth |
| Payments | Stripe |
| Uploads | Multer |
| Validation | Zod |
| Security | Helmet, CORS, Compression |
| Logging | Morgan |
| Optional AI | OpenAI SDK, Google Generative AI SDK |

## Folder Guide

```text
src/
|-- auth.js                 Better Auth configuration
|-- env.js                  Environment parsing and production checks
|-- index.js                Express app entry point
|-- config/                 MongoDB connection and retry logic
|-- middleware/             Session, bearer, and role protection
|-- models/                 Mongoose schemas
|-- routes/                 API route modules
|-- scripts/                Seed script
|-- services/               Shared business logic
|-- utils/                  HTTP and async helpers
uploads/                    Runtime upload directory
```

## Environment Variables

Create `.env` from `.env.example`.

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/prompthive
MONGODB_DB=prompthive
MONGODB_CONNECT_RETRIES=5
MONGODB_CONNECT_RETRY_DELAY_MS=1500

BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=replace-with-a-strong-32-character-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

STRIPE_SECRET_KEY=sk_test_replace_me
PREMIUM_PRICE_USD=5

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

DEFAULT_ADMIN_NAME=PromptHive Admin
DEFAULT_ADMIN_EMAIL=admin@demo.com
DEFAULT_ADMIN_PASSWORD=admin1234
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas or local MongoDB connection string |
| `MONGODB_DB` | Yes | Database name |
| `CLIENT_URL` | Yes | Frontend origin for CORS and auth trusted origins |
| `SERVER_URL` | Yes | Public backend URL |
| `BETTER_AUTH_URL` | Yes | Better Auth base URL |
| `BETTER_AUTH_SECRET` | Yes | Strong session secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Yes | Stripe server secret key |
| `PREMIUM_PRICE_USD` | Yes | One-time premium price |
| `OPENAI_API_KEY` | Optional | Enables OpenAI prompt testing |
| `GEMINI_API_KEY` | Optional | Enables Gemini prompt testing |

Do not commit `.env`.

## Local Setup

```bash
npm install
copy ".env.example" ".env"
npm run seed
npm run dev
```

Local API:

```text
http://localhost:5000
```

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Express with Node watch mode |
| `npm run start` | Start production server |
| `npm run seed` | Create demo admin, creators, prompts, reviews, and premium data |

## Demo Admin

Run the seed script first:

```bash
npm run seed
```

Then sign in with:

```text
Email: admin@demo.com
Password: admin1234
```

## API Route Overview

| Route Group | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth endpoints |
| `/api/prompts` | Prompt marketplace, CRUD, moderation, copy, fork, and analytics |
| `/api/bookmarks` | Save and remove bookmarked prompts |
| `/api/reviews` | Public reviews and user review history |
| `/api/reports` | Prompt reporting and admin report moderation |
| `/api/users` | Current user, profile updates, role updates, and admin user actions |
| `/api/payments` | Stripe premium payment and payment records |
| `/api/uploads` | Image upload handling |
| `/api/analytics` | Admin and creator analytics |
| `/api/notifications` | User notification records |
| `/api/ai` | Optional prompt quality testing |

## Deployment

Recommended platform: Render.

```text
Root Directory: AI Prompt Sharing & Marketplace Platform_Server
Build Command: npm install
Start Command: npm start
```

Production environment:

```env
NODE_ENV=production
CLIENT_URL=https://prompt-hive-client.vercel.app
SERVER_URL=https://prompthive-server.onrender.com
BETTER_AUTH_URL=https://prompthive-server.onrender.com
MONGODB_URI=your-production-atlas-uri
MONGODB_DB=prompthive
BETTER_AUTH_SECRET=your-strong-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
STRIPE_SECRET_KEY=sk_test_or_live_key
PREMIUM_PRICE_USD=5
```

Google OAuth redirect URI:

```text
https://prompthive-server.onrender.com/api/auth/callback/google
```

Render free services can sleep after inactivity. The client includes retry handling for safe reads, but the first request after a cold start may still take a few seconds.

## Production Checklist

- MongoDB Atlas allows connections from the deployed server
- `CLIENT_URL`, `SERVER_URL`, and `BETTER_AUTH_URL` use deployed HTTPS URLs
- Google OAuth authorized redirect URI points to the deployed backend
- Stripe secret key and frontend publishable key use the same Stripe mode
- CORS allows the deployed frontend origin
- Prompt submissions default to `pending`
- Admin can approve, reject with feedback, feature, and delete prompts
- Reports can be dismissed, warned, or removed
- Premium payment updates user subscription and unlocks private prompts
- Seed data creates realistic prompts, creators, reviews, and demo admin access

## Verification

```bash
node --check src/index.js
node --check src/routes/prompts.js
node --check src/routes/reviews.js
node --check src/scripts/seed.js
```

## Notes For Evaluators

- Prompt submissions are saved as pending until an admin approves, rejects with feedback, features, or deletes them.
- Reports, payments, users, analytics, uploads, bookmarks, reviews, and premium access are handled through dedicated API modules.
- Render free services may sleep after inactivity; the server includes MongoDB retry logic and the client handles safe retry reads.

---

<div align="center">

PromptHive Server - backend API for a full-stack AI prompt marketplace.

</div>
