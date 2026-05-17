---
id: getting-started
title: Getting Started
sidebar_position: 2
---

# Getting Started

You'll be up and running in under 5 minutes.

## Prerequisites

- **Node.js 20+** (`node --version`)
- **npm 10+** (`npm --version`)
- An **[Anthropic API key](https://console.anthropic.com/)** — powers all AI features

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/catesandrew/job-search.git
cd job-search
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

```bash
cp .env.example .env
```

Open `.env` in your editor and fill in the required values:

```env
# Database — SQLite, stored in prisma/dev.db
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"   # generate: openssl rand -base64 32

# Your login credentials (used when seeding the database)
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="your-password"
ADMIN_NAME="Your Name"

# AI providers
ANTHROPIC_API_KEY="sk-ant-..."   # required
```

:::tip Generate a secure secret
```bash
openssl rand -base64 32
```
Paste the output as your `NEXTAUTH_SECRET`.
:::

### 4. Set up the database

```bash
# Run all migrations (creates the SQLite schema)
npm run db:migrate

# Seed the database (creates your admin account using ADMIN_* env vars)
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**. You'll be redirected to `/login` — sign in with the email and password you set in `.env`.

---

## First steps after logging in

### Add your first application

1. Go to **Applications** → **New Application**
2. Paste a job posting URL into the **Import from URL** field
3. Click **Import** — the form pre-fills with all extracted fields
4. Review and click **Save**

→ See [URL Import](./features/url-import) for details

### Set up your resume

1. Go to **Resumes** → **New Resume**
2. Fill in your profile, positions, skills, and education
3. When ready to tailor for a specific role, click **Duplicate** and link the copy to an application

→ See [Resume Builder](./features/resume-builder) for details

### Build your experience library

1. Go to **Library**
2. Add your positions and the best bullet points from your career
3. These become the source material for AI-generated interview answers and resume bullets

→ The library is the foundation for [Interview Prep](./features/interview-prep)

---

## Available commands

```bash
npm run dev           # Start dev server on port 3000
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint

npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed admin user
npm run db:studio     # Open Prisma Studio (database GUI at port 5555)

npm run e2e           # Run Playwright E2E tests (requires: npm run build first)
```

---

## Next steps

- [Configuration reference](./configuration) — all environment variables
- [URL Import](./features/url-import) — import job postings in seconds
- [Resume Builder](./features/resume-builder) — tailor resumes with AI
- [Interview Prep](./features/interview-prep) — prepare with your actual experience
- [Deployment](./deployment) — deploy to Vercel or self-host
