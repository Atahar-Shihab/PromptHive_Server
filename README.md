# PromptHive Server

PromptHive Server is the Express.js backend for the AI Prompt Sharing and Marketplace Platform. It provides authentication, role-based authorization, prompt moderation, marketplace APIs, premium payment handling, uploads, analytics, reports, reviews, bookmarks, and optional AI prompt testing.

Live API: add your deployed Render link here  
Frontend: add your deployed Vercel link here  
Client Repository: https://github.com/Atahar-Shihab/PromptHive_client

## Project Purpose

This backend powers a full-stack AI prompt marketplace where users can publish prompts, creators can track performance, admins can moderate submissions, and premium users can unlock private prompt content.

## Core Features

- MongoDB database connection with retry logic for cold deployments
- Better Auth email/password authentication
- Google OAuth login with default user role assignment
- JWT/Bearer authentication support
- Role-based protected APIs for user, creator, and admin flows
- Prompt CRUD with pending, approved, rejected, featured, public, and private states
- Server-side search, filtering, sorting, and pagination
- Bookmark toggle with duplicate prevention
- Copy count tracking
- Review and rating system
- Report prompt workflow
- Admin prompt approval, rejection feedback, delete, and feature actions
- Admin user role management and delete actions
- Stripe one-time $5 premium unlock
- Payment transaction storage
- Image upload support for thumbnails and profile photos
- Dashboard analytics using MongoDB aggregation
- Optional OpenAI/Gemini prompt testing endpoint
- Seed script for realistic prompts, creators, reviews, and demo admin

## Tech Stack

| Area | Packages |
| --- | --- |
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB, Mongoose, MongoDB native driver |
| Auth | Better Auth, Google OAuth, JWT/Bearer plugins |
| Payments | Stripe |
| Uploads | Multer |
| Validation | Zod |
| Security | Helmet, CORS, Compression |
| Logging | Morgan |
| Optional AI | OpenAI SDK, Google Generative AI SDK |

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

## Demo Admin

Run the seed command first:

```bash
npm run seed
```

Then login with:

```text
Email: admin@demo.com
Password: admin1234
```

## Available Scripts

```bash
npm run dev
npm run start
npm run seed
```

## Main API Areas

| Area | Purpose |
| --- | --- |
| Auth | Better Auth routes for email and Google login |
| Prompts | Prompt listing, filtering, moderation, copy, fork, analytics |
| Bookmarks | Save and remove prompts for the logged-in user |
| Reviews | Create, list, and manage prompt reviews |
| Reports | Submit and moderate reported prompts |
| Users | Current user profile, role updates, profile photo updates |
| Payments | Stripe premium unlock and payment records |
| Analytics | Admin and creator statistics |
| Uploads | Image upload for prompt thumbnails and profiles |
| AI | Optional prompt quality testing |

## Deployment

Recommended platform: Render.

Render settings:

```text
Root Directory: AI Prompt Sharing & Marketplace Platform_Server
Build Command: npm install
Start Command: npm start
```

Production environment:

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

- MongoDB Atlas connection string is set in Render
- Atlas Network Access allows the deployed server
- `CLIENT_URL`, `SERVER_URL`, and `BETTER_AUTH_URL` use deployed HTTPS URLs
- Google OAuth redirect URI uses the deployed backend URL
- Stripe secret key and client publishable key belong to the same Stripe mode
- CORS does not block the deployed frontend
- Reloading protected frontend routes does not log the user out
- Admin can approve, reject, feature, and delete prompts
- Premium payment updates user subscription and unlocks private prompts

## Submission Notes

Server repository requirement: at least 12 meaningful commits.  
Current target: 13 or more commits after final README polish.
