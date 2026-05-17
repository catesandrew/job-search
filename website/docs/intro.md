---
id: intro
title: Introduction
sidebar_position: 1
slug: /intro
---

# Job Search Dashboard

> **Your AI-powered unfair advantage in the job search.**

Job Search Dashboard is a self-hosted, open-source Next.js application that combines application tracking, resume building, interview preparation, and an AI career coach into a single local dashboard.

## Why it exists

Modern job searching is chaotic. You have applications spread across your email, your LinkedIn, and a spreadsheet that's already stale. Your resume is a generic document that "kind of fits" every role but nails none of them. Interview prep happens the night before — from memory, not from your actual experience. And you pay $30/month to a SaaS product that still doesn't know who you are.

This dashboard was built to fix that, tool by tool:

| Problem | Solution |
|---|---|
| Applications scattered everywhere | Kanban board with full application detail |
| Copy-pasting job descriptions | Paste URL → AI extracts everything in 10 seconds |
| Generic resumes | AI Auto-Improve tailors every bullet for the specific role |
| Interview prep from memory | AI generates questions + STAR answers from *your* work history |
| No company context | AI fetches company website and builds a company brief |
| No career advisor | Built-in chat coach that knows your full application and resume |

## How it runs

Job Search Dashboard is a **Next.js 15 app** that runs entirely on your machine:

- **Database:** SQLite via Prisma — a single `.db` file, no external database server
- **Auth:** NextAuth.js credentials — single-user, email + password set via `.env`
- **AI:** Direct calls to Anthropic, OpenAI, and/or Google using their official Node.js SDKs
- **No cloud sync:** Your career data never leaves your machine

The only outbound requests are the AI API calls you explicitly trigger.

## What you need

- **Node.js 20+** and **npm 10+**
- An **Anthropic API key** — required for all AI features (resume improvements, interview prep, company insights, URL import, chat)
- Optional: OpenAI or Google API keys to enable additional providers in the chat panel

→ **[Get started in 5 minutes](./getting-started)**

## Architecture summary

```
Browser (React 19)
  └── Next.js 15 App Router
        ├── /app/(dashboard)/**     — All protected pages
        ├── /app/api/**             — REST + streaming API routes
        └── /lib/ai/**              — Provider abstraction layer
              ├── anthropic-provider.ts
              ├── mcp-bridge-provider.ts   (optional local routing)
              └── provider-registry.ts
```

For a full architecture walkthrough, see [Architecture: System Overview](./architecture/overview).

## MCP Agent Bridge

If you want to route AI requests to locally-running models instead of hosted APIs, check out **[mcp-agent-bridge](https://github.com/catesandrew/mcp-agent-bridge)** — a local bridge that exposes any MCP-compatible model to this dashboard via a simple HTTP interface.

See [Architecture: MCP Agent Bridge](./architecture/mcp-agent-bridge) for integration details.
