---
id: configuration
title: Configuration
sidebar_position: 3
---

# Configuration

All configuration is done via environment variables in the `.env` file. Copy `.env.example` to get started.

```bash
cp .env.example .env
```

---

## Required variables

These must be set before the app will start correctly.

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | SQLite file path | `file:./prisma/dev.db` |
| `NEXTAUTH_URL` | Full base URL of the app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret for session signing | _(generate below)_ |
| `ADMIN_EMAIL` | Email for your account | `you@example.com` |
| `ADMIN_PASSWORD` | Password for your account | any strong password |
| `ADMIN_NAME` | Display name | `Your Name` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Paste the output as `NEXTAUTH_SECRET`. Keep it secret — it signs all session cookies.

### Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys → Create Key
4. Copy the key starting with `sk-ant-`

---

## Optional AI providers

These enable additional providers in the Career Coach chat panel. All AI features work without them — only the Anthropic chat option requires `ANTHROPIC_API_KEY`.

| Variable | Provider | Model used | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI | `gpt-4o-mini` | Enables "GPT" option in chat |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google | `gemini-2.0-flash` | Enables "Gemini" option in chat |

If a provider key is missing, its button still appears in the chat UI but requests will return an API error. Only set the providers you actually want to use.

---

## Optional: MCP Agent Bridge

Connect locally-running AI models via [mcp-agent-bridge](https://github.com/catesandrew/mcp-agent-bridge). When a bridge URL is set and the bridge is reachable, the app routes AI calls through it instead of the hosted provider API.

| Variable | Description | Default |
|---|---|---|
| `MCP_CLAUDE_URL` | Claude bridge endpoint | `http://localhost:8960/mcp` |
| `MCP_CODEX_URL` | Codex bridge endpoint | `http://localhost:8961/mcp` |
| `MCP_COPILOT_URL` | Copilot bridge endpoint | `http://localhost:8962/mcp` |

See [MCP Agent Bridge](./architecture/mcp-agent-bridge) for setup details.

---

## Optional: Zitadel SSO

If you want SSO via a local Zitadel instance instead of credentials auth:

| Variable | Description |
|---|---|
| `ZITADEL_ISSUER` | Zitadel base URL, e.g. `http://localhost:8080` |
| `ZITADEL_CLIENT_ID` | Client ID from Zitadel app settings |
| `ZITADEL_CLIENT_SECRET` | Client secret (only for Code+Secret flow) |

Create a **Web** app in Zitadel with:
- Auth Method: `CODE`
- Redirect URI: `http://localhost:3000/api/auth/callback/zitadel`

---

## Complete .env.example

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-change-this"

# Admin credentials (seeded user)
ADMIN_EMAIL="admin@localhost"
ADMIN_PASSWORD="changeme123"
ADMIN_NAME="Your Name"

# Anthropic API (required — for all AI features)
ANTHROPIC_API_KEY=""

# OpenAI API (optional — GPT-4o mini in chat)
OPENAI_API_KEY=""

# Google Generative AI (optional — Gemini 2.0 Flash in chat)
GOOGLE_GENERATIVE_AI_API_KEY=""

# Zitadel OIDC (optional — SSO via local Zitadel instance)
ZITADEL_ISSUER=""
ZITADEL_CLIENT_ID=""
ZITADEL_CLIENT_SECRET=""

# MCP Bridge URLs (optional — local AI model routing)
MCP_CLAUDE_URL="http://localhost:8960/mcp"
MCP_CODEX_URL="http://localhost:8961/mcp"
MCP_COPILOT_URL="http://localhost:8962/mcp"
```

---

## Production configuration

For production deployments, change these values:

```env
NEXTAUTH_URL="https://yourdomain.com"      # Your actual domain
DATABASE_URL="file:./prisma/prod.db"       # Or a hosted Postgres URL
```

:::caution SQLite in production
SQLite works well for single-user production use but is not suitable for multi-server deployments. For multi-instance production, switch to PostgreSQL:
1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
2. Update `DATABASE_URL` to your PostgreSQL connection string
3. Run `npm run db:migrate` against the new database
:::
