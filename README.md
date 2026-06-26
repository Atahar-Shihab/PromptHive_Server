<div align="center">

# PromptHive Server

### Express, MongoDB, Better Auth, Google OAuth, Stripe, uploads, analytics, and moderation APIs for PromptHive.

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-API-111111?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img alt="Better Auth" src="https://img.shields.io/badge/Better_Auth-Sessions-222222?style=for-the-badge" />
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Premium-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
</p>

<p>
  <a href="#live-links">Live Links</a>
  <span> | </span>
  <a href="#api-capabilities">API Capabilities</a>
  <span> | </span>
  <a href="#environment-variables">Environment</a>
  <span> | </span>
  <a href="#deployment">Deployment</a>
  <span> | </span>
  <a href="#production-checklist">Checklist</a>
</p>

</div>

---

## Live Links

| Item | Link |
| --- | --- |
| Live API | Add your deployed Render link here |
| Frontend | Add your deployed Vercel link here |
| Client Repository | https://github.com/Atahar-Shihab/PromptHive_client |

## Project Snapshot

PromptHive Server is the backend API for an AI prompt sharing and marketplace platform. It handles secure sessions, role-based access, prompt moderation, premium unlocks, uploaded images, reports, reviews, bookmarks, analytics, and realistic seed data for a complete assignment-ready product.

```text
PromptHive Server
|
+-- Auth Layer
|   +-- Email/password login
|   +-- Google OAuth
|   +-- JWT and Bearer support
|
+-- Marketplace Layer
|   +-- Prompt CRUD
|   +-- Search, filter, sort, pagination
|   +-- Bookmarks, reviews, reports, copy count
|
+-- Premium Layer
|   +-- Stripe payment intent
|   +-- Payment records
|   +-- Premium subscription update
|
+-- Admin Layer
    +-- Users
    +-- Prompt moderation
    +-- Reports
    +-- Payments
    +-- Analytics
```

## API Capabilities

| Area | Capability |
| --- | --- |
| Authentication | Better Auth email/password sessions, Google OAuth, JWT/Bearer plugin support |
| Authorization | Role-based middleware for user, creator, and admin APIs |
| Prompts | Create, update, delete, approve, reject, feature, fork, copy, and fetch prompt analytics |
| Marketplace | Server-side search by title/tags/tool, filtering by category/tool/difficulty/access, sorting by latest/popular/copied |
| Bookmarks | Toggle bookmarks and prevent duplicate saved prompts |
| Reviews | Create reviews, list public reviews, list own reviews, and display rating metadata |
| Reports | Submit reports and let admins dismiss, warn, or remove reported prompts |
| Payments | Stripe one-time premium unlock, transaction storage, premium status update |
| Uploads | Multer image upload for prompt thumbnails and profile photos |
| Analytics | MongoDB aggregation for totals, copies, trends, creators, and admin dashboard data |
| AI Testing | Optional OpenAI/Gemini prompt quality testing endpoint |
| Seed Data | Realistic prompts, creators, reviews, premium/private prompts, and demo admin |

## Role Matrix

| Role | Server Permissions |
| --- | --- |
| User | Browse approved prompts, bookmark, copy, review accessible prompts, report prompts, submit prompts, update profile |
| Creator | Create and manage prompts, view creator analytics, track prompt growth and copies |
| Admin | Manage users, change roles, approve/reject prompts, feature prompts, moderate reports, inspect payments, view analytics |

## Tech Stack

| Category | Packages |
| --- | --- |
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB, Mongoose, MongoDB native driver |
| Authentication | Better Auth, Google OAuth, JWT/Bearer plugins |
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
|-- index.js                Express app entry
|-- config/                 MongoDB connection and retry logic
|-- middleware/             Auth and role protection
|-- models/                 Mongoose schemas
|-- routes/                 API route modules
|-- scripts/                Seed script
|-- services/               Shared business helpers
|-- utils/                  Async and HTTP helpers
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
| `CLIENT_URL` | Yes | Frontend origin for CORS and trusted auth origins |
| `SERVER_URL` | Yes | Backend public URL |
| `BETTER_AUTH_URL` | Yes | Better Auth base URL |
| `BETTER_AUTH_SECRET` | Yes | Session/auth secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Yes | Stripe server secret key |
| `OPENAI_API_KEY` | Optional | Enables OpenAI prompt testing |
| `GEMINI_API_KEY` | Optional | Enables Gemini prompt testing |

Never commit `.env`.

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

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Express with Node watch mode |
| `npm run start` | Start production server |
| `npm run seed` | Create demo admin, creators, prompts, and reviews |

## Demo Admin

Run seed first:

```bash
npm run seed
```

Then use:

```text
Email: admin@demo.com
Password: admin1234
```

## API Route Overview

| Route Group | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth endpoints |
| `/api/prompts` | Prompt marketplace, moderation, copy, fork, analytics |
| `/api/bookmarks` | Save and remove bookmarked prompts |
| `/api/reviews` | Prompt reviews and user review history |
| `/api/reports` | Report prompt and admin report moderation |
| `/api/users` | Current user, profile, role updates, admin user actions |
| `/api/payments` | Stripe premium payment and payment records |
| `/api/uploads` | Image uploads |
| `/api/analytics` | Admin and creator analytics |
| `/api/notifications` | Notification records |
| `/api/ai` | Optional AI prompt testing |

## Deployment

Recommended platform: Render.

```text
Root Directory: AI Prompt Sharing & Marketplace Platform_Server
Build Command: npm install
Start Command: npm start
```

Production variables:

```env
NODE_ENV=production
CLIENT_URL=https://your-vercel-client.vercel.app
SERVER_URL=https://your-render-api.onrender.com
BETTER_AUTH_URL=https://your-render-api.onrender.com
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
https://your-render-api.onrender.com/api/auth/callback/google
```

## Production Checklist

- MongoDB Atlas connection works from deployed server
- `CLIENT_URL`, `SERVER_URL`, and `BETTER_AUTH_URL` use deployed HTTPS URLs
- Google OAuth redirect URI points to the deployed backend
- Stripe secret key matches the frontend publishable key mode
- CORS allows the deployed frontend
- Protected routes return correct data for user, creator, and admin roles
- Prompt submissions default to `pending`
- Admin can approve, reject with feedback, feature, and delete prompts
- Premium payment updates user subscription and unlocks private prompts
- Reports can be dismissed, warned, or removed

## Assignment Submission

| Requirement | Status |
| --- | --- |
| Server repository commits | 12+ meaningful commits |
| MongoDB credentials | Secured through environment variables |
| Auth | Better Auth, Google OAuth, JWT/Bearer plugin support |
| Challenge features | Pagination, backend search/filter/sort, MongoDB aggregation |
| Optional features | AI testing, notifications, forking support, premium payment, upload flow |

---

<div align="center">

Backend API for PromptHive, a full-stack AI prompt marketplace.

</div>
