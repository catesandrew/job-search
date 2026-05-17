# Job Search Dashboard

> **Your AI-powered unfair advantage in the job search.**
> Track every application, tailor every resume, walk into every interview prepared — all from one dashboard that actually knows your experience.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/catesandrew/job-search)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Docs](https://img.shields.io/badge/docs-github.io-green)](https://catesandrew.github.io/job-search)

---

## The problem with job searching today

You're juggling 40 browser tabs, a spreadsheet that's already out of date, a resume that kind of fits every job description but nails none of them, and interview prep you did at 11pm the night before. Sound familiar?

**Job Search Dashboard fixes this.** One local app, your data, your AI keys — no subscriptions, no SaaS lock-in, no uploading your resume to a stranger's server.

---

## What it does

| Pain point | How we solve it |
|---|---|
| "I lost track of where I applied" | Kanban board — Wishlist → Applied → Interviewing → Offer/Rejected |
| "Copying job descriptions takes forever" | Paste a URL → AI extracts company, role, salary, JD in seconds |
| "My resume isn't tailored for this role" | AI Auto-Improve reviews every bullet and proposes specific rewrites |
| "I don't know what to expect in the interview" | One click generates role-specific questions with STAR answers from *your* experience |
| "I don't know anything about this company" | AI fetches the company site and builds a full company brief automatically |
| "I need to think through my negotiation strategy" | Built-in career coach chat with full context of your applications and resume |

---

## ✨ Features

### 📋 Application Kanban
Drag-and-drop board across **Wishlist, Applied, Interviewing, Offer, Rejected**. Every card holds the full job description, salary target, notes, and linked resume — no spreadsheet required.

### 🔗 One-Click URL Import
Paste any Greenhouse, Lever, LinkedIn, Workday, or company careers page URL. The app fetches it server-side, strips nav/footer/sidebar with Mozilla Readability, converts to clean Markdown, and uses AI to pull out every structured field. What used to take 10 minutes takes 10 seconds.

### 📝 Resume Builder with AI Auto-Improve
- Maintain a **base resume** and create tailored copies per application
- Edit positions, bullets, skills, education, and projects inline
- **Auto-Improve**: AI reviews all your bullets at once, proposes specific rewrites, you review each change before accepting — no surprises
- Multiple templates (Harvard, Chicago, Bauhaus, Oxford, Neue, Miller)
- PDF export built in

### 🧠 Experience Library
Your master bank of career accomplishments, independent of any resume version. Pick bullets from the library when building a tailored resume — stop rewriting the same things from memory.

### 🎯 Interview Prep
- AI generates likely questions based on the actual job description + your linked resume
- Questions are ranked **High / Medium / Low** probability
- Every question includes a STAR-format answer drawn from your real experience
- **Known Questions panel**: paste in questions the recruiter already sent you — AI answers those first

### 🏢 Company Insights
Tell the app the company URL. Click Generate. Get back: company description, recent announcements, funding rounds, business financials, culture & values, and similar companies — all sourced from the actual website, cached so you only fetch once.

### 💬 AI Career Coach Chat
A context-aware chat panel that lives on every page:
- On an application page → knows the JD, your linked resume, and your interview questions
- On a resume page → knows your entire resume
- On the library page → knows all your experience and skills
- Switch between **Claude (Anthropic), GPT-4o mini (OpenAI), and Gemini 2.0 Flash (Google)** in a single click
- Streaming responses, suggested prompts per context, full chat history

### 🔒 Fully Local & Private
SQLite database, no cloud sync, no third-party analytics. Your career data stays on your machine. Only AI API calls go out, directly to the provider of your choice.

---

## 🚀 Quick Start

**You'll be running in under 5 minutes.**

### Prerequisites
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/) (required — powers all AI features)

### 1. Clone & install

```bash
git clone https://github.com/catesandrew/job-search.git
cd job-search
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` — the minimum required values:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="your-password"
ADMIN_NAME="Your Name"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Set up the database & run

```bash
npm run db:migrate   # run migrations
npm run db:seed      # create your account
npm run dev          # start the app
```

Open [http://localhost:3000](http://localhost:3000), sign in, and start adding applications.

---

## 🔌 MCP Agent Bridge (Advanced)

For power users who want to connect local AI models (Claude, Codex, Copilot) via the Model Context Protocol, check out **[mcp-agent-bridge](https://github.com/catesandrew/mcp-agent-bridge)** — a local bridge server that routes AI requests from this dashboard to any MCP-compatible model.

Configure it with the optional env vars in `.env.example`:
```env
MCP_CLAUDE_URL="http://localhost:8960/mcp"
MCP_CODEX_URL="http://localhost:8961/mcp"
MCP_COPILOT_URL="http://localhost:8962/mcp"
```

When a bridge URL is configured and reachable, the app automatically routes AI requests through it instead of the hosted provider API. This means you can run models locally, control costs, and use models not available via hosted APIs.

---

## 📖 Full Documentation

**[→ Read the docs](https://catesandrew.github.io/job-search)**

The documentation site covers:
- Detailed feature guides with examples
- Full configuration reference
- Architecture deep-dive
- MCP Agent Bridge integration
- Deployment guides (Vercel, Docker, self-hosted)

---

## Tech Stack

```
Next.js 15 App Router    TypeScript 5 (strict)
Prisma 6 + SQLite        NextAuth.js v5
shadcn/ui + Tailwind     TanStack Query v5
Vercel AI SDK v6         @mozilla/readability
turndown                 Playwright (E2E)
```

---

## Scripts

```bash
npm run dev           # dev server at localhost:3000
npm run build         # production build
npm run db:migrate    # run Prisma migrations
npm run db:seed       # seed admin user
npm run db:studio     # Prisma Studio GUI
npm run e2e           # Playwright tests (requires built app)
```

---

## Optional AI Providers

All AI features work with Anthropic only. OpenAI and Google unlock additional models in the chat panel:

```env
OPENAI_API_KEY="sk-..."                  # GPT-4o mini in chat
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."  # Gemini 2.0 Flash in chat
```

---

## Contributing

Issues and PRs welcome. This is a personal project built in the open — if it helps your job search, that's the point.

---

## License

MIT
