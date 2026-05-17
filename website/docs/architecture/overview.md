---
id: overview
title: System Overview
sidebar_position: 1
---

# Architecture: System Overview

Job Search Dashboard is a standard Next.js full-stack application with a layered architecture. Everything runs in a single process on your machine — no microservices, no message queues, no separate API server.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 + TanStack Query + shadcn/ui               │   │
│  │  /app/(dashboard)/**  — all protected pages          │   │
│  │  /components/**       — shared UI components         │   │
│  │  /hooks/**            — data-fetching hooks          │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / SSE
┌─────────────────────────▼───────────────────────────────────┐
│  Next.js 15 App Router (Node.js process)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /app/api/**  — REST + streaming route handlers      │   │
│  │    ├── /api/applications/**   CRUD + import-url      │   │
│  │    ├── /api/resumes/**        CRUD + PDF export      │   │
│  │    ├── /api/ai/**             improve, score, etc.   │   │
│  │    ├── /api/chat              SSE streaming chat     │   │
│  │    └── /api/auth/**           NextAuth.js            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  /lib/**  — shared business logic                    │   │
│  │    ├── /lib/ai/**        AI provider abstraction     │   │
│  │    ├── /lib/pdf/**       Puppeteer PDF generation    │   │
│  │    ├── /lib/scoring/**   Resume scoring              │   │
│  │    ├── /lib/session.ts   Session helpers             │   │
│  │    └── /lib/prisma.ts    Prisma client singleton     │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Prisma ORM → SQLite (prisma/dev.db)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴──────────────┐
              │  External AI APIs        │
              │  ├── Anthropic (req'd)   │
              │  ├── OpenAI (optional)   │
              │  └── Google (optional)   │
              │                          │
              │  OR: MCP Agent Bridge    │
              │  (local model routing)   │
              └──────────────────────────┘
```

## Request lifecycle

### A typical page load

1. Browser requests a protected route (e.g. `/applications/abc123`)
2. `middleware.ts` checks session cookie via NextAuth — redirects to `/login` if missing
3. Next.js renders the React Server Component for the route
4. The page shell renders; client-side React takes over
5. TanStack Query hooks fire `fetch()` calls to the API routes
6. API routes authenticate via `getServerSession()`, query Prisma, return JSON
7. TanStack Query caches the results; components re-render with data

### An AI feature call (e.g. interview prep)

1. User clicks "Generate Prep" on the Interview Prep tab
2. `useInterviewPrep` mutation fires `POST /api/applications/{id}/interview-prep`
3. API route: auth check → load application + linked resume + library via Prisma
4. Calls `generateInterviewPrep()` from `lib/ai/mcp-tools.ts`
5. `getActiveProvider()` picks the configured AI provider
6. Provider calls the AI API with the constructed prompt
7. AI returns JSON with questions array
8. Route saves questions to `InterviewPrep` table, returns to client
9. TanStack Query updates the cache; interview prep renders

### Streaming chat

1. User sends a message in the chat panel
2. `fetch('/api/chat', { method: 'POST', body: { messages, pathname, provider } })`
3. API route builds context from Prisma based on `pathname`
4. Calls `streamText()` from Vercel AI SDK
5. Returns `result.toTextStreamResponse()` — a streaming response
6. Client reads the stream with `ReadableStream.getReader()` + `TextDecoder`
7. Each decoded chunk is appended to the assistant message in React state
8. UI updates token-by-token as chunks arrive

## Data model

The SQLite database has 21 models. Key relationships:

```
User
  ├── Application (one-to-many)
  │     ├── InterviewPrep (one-to-one)
  │     └── CoverLetter (one-to-many)
  ├── Resume (one-to-many)
  │     ├── Profile (one-to-one)
  │     ├── Position → Bullet (one-to-many)
  │     ├── SkillCategory (one-to-many)
  │     ├── Education (one-to-many)
  │     └── Project (one-to-many)
  ├── LibraryExperience → LibraryBullet (one-to-many)
  ├── SkillLibraryCategory (one-to-many)
  └── LibraryEducation (one-to-many)

Application
  └── Resume (linked via resumeId FK)
```

## AI provider layer

All AI calls go through a provider abstraction in `lib/ai/`:

```typescript
interface AiProvider {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  generateText(prompt: string): Promise<string>
  optimize(req: AiOptimizeRequest): Promise<AiOptimizeResponse>
  analyzeJd(req: AiAnalyzeRequest): Promise<AiAnalyzeResponse>
  generateCoverLetter(req: AiCoverLetterRequest): Promise<AiCoverLetterResponse>
}
```

Implementations:
- `anthropic-provider.ts` — uses `@ai-sdk/anthropic` directly
- `mcp-bridge-provider.ts` — routes through `mcp-agent-bridge` if configured

`getActiveProvider()` in `provider-registry.ts` checks configured env vars and returns the highest-priority available provider.

## Key technology choices

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | Full-stack in one codebase; server components + API routes |
| Database | SQLite via Prisma | Zero-config local storage; no external DB server needed |
| AI SDK | Vercel AI SDK v6 | Unified interface for Anthropic/OpenAI/Google; streaming built in |
| HTML extraction | @mozilla/readability | Same engine as Firefox Reader View; battle-tested content extraction |
| PDF generation | Puppeteer | Server-side headless Chrome; pixel-accurate PDF from HTML/CSS |
| State management | TanStack Query v5 | Automatic caching, background refetch, optimistic updates |
| UI components | shadcn/ui + Radix | Accessible, unstyled primitives; copy-owned, not a dependency |
| Auth | NextAuth.js v5 | Credentials provider for single-user local auth |
