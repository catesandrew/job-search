# Job Search Dashboard

An AI-powered personal job search dashboard built with Next.js 15, Prisma, and the Vercel AI SDK. Track applications on a Kanban board, build tailored resumes, generate interview prep, get company insights, and chat with an AI career coach — all in one place.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC)

---

## Features

### Application Tracking
- **Kanban board** — drag applications across Wishlist, Applied, Interviewing, Offer, and Rejected columns
- **Import from URL** — paste a Greenhouse, Lever, LinkedIn, or Workday job posting URL and the app extracts company, role, location, salary, and job description automatically
- **Full detail view** — notes, salary target, job description, linked resume, and status all in one place

### Resume Builder
- **Multiple resume versions** — maintain separate base resumes and application-specific tailored copies
- **Inline editor** — edit profile summary, work experience, skills, education, and projects directly in the browser
- **AI Auto-Improve** — one-click AI review of every bullet point; review proposed changes before accepting
- **Duplicate & tailor** — clone a base resume, link it to a specific application, and customize for that role
- **PDF export** — download any resume as a formatted PDF

### Experience Library
- **Centralized bullet bank** — maintain a master library of all accomplishments, independent of any resume version
- **Reusable across resumes** — pick bullets from the library when building a new resume variant

### Interview Prep
- **AI-generated questions** — generate likely interview questions tailored to the job description and your linked resume
- **Company-provided questions** — input questions you received in advance; AI answers them using your actual experience
- **Probability scoring** — questions ranked by likelihood (High / Medium / Low)
- **STAR answers** — each question includes a structured behavioral answer drawn from your experience library

### Company Insights
- **Auto-generated profiles** — AI fetches the company website and produces a structured company brief
- **Sections:** Company description, recent announcements, funding rounds, business financials, culture & values, similar companies
- **Cached** — generated once and stored; regenerate on demand

### AI Career Coach Chat
- **Context-aware** — the chat sidebar loads data relevant to the current page (application details, resume content, cover letter, or library)
- **Multi-provider** — switch between Claude (Anthropic), GPT-4o mini (OpenAI), and Gemini 2.0 Flash (Google) in a single click
- **Streaming** — server-sent events with real-time token-by-token display
- **Suggested prompts** — context-appropriate quick-start prompts per page

### Cover Letters
- Create and manage cover letters linked to specific applications

### Settings
- Manage AI provider configuration and personal profile information

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5 (strict) |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js v5 (credentials) |
| UI | shadcn/ui + Tailwind CSS |
| State | TanStack Query v5 |
| AI SDK | Vercel AI SDK v6 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`) |
| HTML→MD | `@mozilla/readability` + `jsdom` + `turndown` |
| E2E Tests | Playwright |

---

## Prerequisites

- Node.js 20+
- npm 10+
- An Anthropic API key ([get one here](https://console.anthropic.com/)) — required for all AI features

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/catesandrew/job-search.git
cd job-search
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
# Database (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Your login credentials (set these before seeding)
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="your-password"
ADMIN_NAME="Your Name"

# AI Providers
ANTHROPIC_API_KEY="sk-ant-..."          # Required — Claude (Haiku by default)
OPENAI_API_KEY="sk-..."                  # Optional — GPT-4o mini in chat
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."  # Optional — Gemini 2.0 Flash in chat
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up the database

```bash
# Run migrations
npm run db:migrate

# Seed the database (creates your admin account)
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`. Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.

---

## Environment Variable Reference

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite file path, e.g. `file:./prisma/dev.db` |
| `NEXTAUTH_SECRET` | Random secret for session signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full base URL of the app, e.g. `http://localhost:3000` |
| `ADMIN_EMAIL` | Email used to seed the admin account |
| `ADMIN_PASSWORD` | Password used to seed the admin account |
| `ADMIN_NAME` | Display name for the admin account |
| `ANTHROPIC_API_KEY` | Anthropic API key — powers all AI features (resume improvements, interview prep, company insights, chat) |

### Optional — Additional Chat Providers

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Enables GPT-4o mini as a chat provider in the Career Coach panel |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Enables Gemini 2.0 Flash as a chat provider in the Career Coach panel |

If `OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` are not set, those provider buttons still appear in the UI but will return an API error when selected. Set only the providers you want to use.

---

## Usage Examples

### Import a job application from a URL

1. Go to **Applications → New Application**
2. Paste a job posting URL (Greenhouse, Lever, LinkedIn, Workday, etc.) into the **Import from URL** field
3. Click **Import** — the form pre-fills with company, role, location, salary, and job description
4. Review the extracted fields, then click **Save**

### Build a tailored resume

1. Go to **Resumes** and click **Duplicate** on your base resume
2. Give the copy a name like "Acme Corp — Senior Engineer"
3. Open the duplicated resume — it's now linked to no application yet
4. Use the inline editor to tailor bullets for the specific role
5. Click **Auto-Improve** to have AI review and suggest improvements to every bullet
6. Review each proposed change, accept or reject, then click **Apply**

### Generate interview prep

1. Open an application that has a linked resume and job description
2. Click the **Interview Prep** tab
3. Optionally, add questions you received from the recruiter in the **Known Questions** panel
4. Click **Generate Prep** — AI produces likely questions, probability scores, and STAR answers
5. Company-provided questions appear first with a "provided" badge; AI fills them with answers from your experience

### Get company insights

1. Open an application
2. In the **About Company** section, click **Generate Insights**
3. AI fetches the company website (using the Company URL you entered) and produces a company brief
4. Sections include: description, recent announcements, funding, culture, and similar companies

### Chat with your AI career coach

1. Click the **chat bubble** (bottom-right corner) on any page
2. The assistant automatically loads context from the current page:
   - On an application page → loads job description, linked resume, and interview questions
   - On a resume page → loads resume content
   - On the library page → loads all your experience bullets and skills
3. Switch providers (Claude / GPT / Gemini) using the dropdown in the chat header
4. Use suggested prompts or ask anything about your job search

---

## Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed admin user and sample data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run e2e          # Run Playwright end-to-end tests (requires built app)
```

---

## Key Routes

| Path | Description |
|---|---|
| `/login` | Sign in |
| `/applications` | Kanban board |
| `/applications/new` | New application (with URL import) |
| `/applications/[id]` | Application detail — overview, interview prep, insights |
| `/resumes` | Resume list |
| `/resumes/new` | Create or upload a resume |
| `/resumes/[id]` | Resume editor with AI Auto-Improve |
| `/library` | Experience library — bullets and skills |
| `/cover-letters` | Cover letter manager |
| `/settings` | Account and AI settings |

---

## Database

The app uses SQLite via Prisma. The database file is created at `prisma/dev.db` (excluded from git).

```bash
# Reset the database and re-seed
npx prisma db push --force-reset
npm run db:seed

# Browse data in a GUI
npm run db:studio

# After schema changes in development
npx prisma db push
```

---

## AI Provider Details

All AI features use the **Anthropic API by default** (`claude-haiku-4-5` for speed and cost). The chat panel additionally supports OpenAI and Google.

| Feature | Model | Provider |
|---|---|---|
| Resume Auto-Improve | claude-haiku-4-5 | Anthropic |
| Interview prep generation | claude-haiku-4-5 | Anthropic |
| Company insights | claude-haiku-4-5 | Anthropic |
| URL import extraction | claude-haiku-4-5 | Anthropic |
| Career coach chat (default) | claude-haiku-4-5 | Anthropic |
| Career coach chat (GPT) | gpt-4o-mini | OpenAI |
| Career coach chat (Gemini) | gemini-2.0-flash | Google |

---

## Production Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from the table above
4. Deploy — Vercel auto-detects Next.js and builds

> **Note:** The default SQLite database is not suitable for multi-server production deployments. For production, switch `DATABASE_URL` to a hosted database (PostgreSQL via Neon, PlanetScale, etc.) and update the Prisma provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.

### Docker (self-hosted)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## E2E Tests

Tests live in `e2e/` and use Playwright. They require a running production build.

```bash
npm run build
npm run e2e
```

---

## License

MIT
