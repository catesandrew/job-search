---
id: mcp-agent-bridge
title: MCP Agent Bridge
sidebar_position: 2
---

# MCP Agent Bridge Integration

**[mcp-agent-bridge](https://github.com/catesandrew/mcp-agent-bridge)** is a local bridge server that routes AI requests from the dashboard to any MCP-compatible model running on your machine. This lets you use locally-running models (or alternative AI providers) instead of hosted APIs — giving you full cost control and complete data privacy.

## Why use it

| Without bridge | With bridge |
|---|---|
| All AI calls go to Anthropic/OpenAI/Google cloud APIs | AI calls can route to local models or self-hosted endpoints |
| API costs per token | Run local models at zero marginal cost |
| Data processed by third-party servers | Everything stays on your machine |
| Limited to models offered by cloud providers | Use any MCP-compatible model |

## How it works

```
Job Search Dashboard
  └── lib/ai/mcp-bridge-provider.ts
        └── HTTP POST to MCP_CLAUDE_URL / MCP_CODEX_URL / MCP_COPILOT_URL
              └── mcp-agent-bridge (local server)
                    └── Forwards to: Claude CLI / Codex CLI / Copilot CLI
                          └── Returns: completion text
```

The bridge exposes a simple HTTP endpoint that accepts a prompt and returns a completion. The dashboard's `McpBridgeProvider` calls it the same way it calls the hosted APIs — the `AiProvider` interface is identical.

## Setup

### 1. Install mcp-agent-bridge

Follow the installation instructions in the **[mcp-agent-bridge repository](https://github.com/catesandrew/mcp-agent-bridge)**.

### 2. Start the bridge

The bridge runs as a local HTTP server. By default it listens on:
- Claude endpoint: `http://localhost:8960/mcp`
- Codex endpoint: `http://localhost:8961/mcp`
- Copilot endpoint: `http://localhost:8962/mcp`

### 3. Configure the dashboard

In your `.env`, set the bridge URLs:

```env
MCP_CLAUDE_URL="http://localhost:8960/mcp"
MCP_CODEX_URL="http://localhost:8961/mcp"
MCP_COPILOT_URL="http://localhost:8962/mcp"
```

You only need to set the URLs for bridges you've actually started. You can run just one (e.g. Claude only) and leave the others unset.

### 4. Restart the dashboard

```bash
npm run dev
```

On startup, the provider registry calls `isAvailable()` on each configured provider. If the bridge URL is reachable, `McpBridgeProvider` is registered and used for AI calls.

## Provider priority

The provider registry picks the active provider in this order:

1. **MCP Bridge (Claude)** — if `MCP_CLAUDE_URL` is set and reachable
2. **MCP Bridge (Codex)** — if `MCP_CODEX_URL` is set and reachable
3. **Anthropic** — if `ANTHROPIC_API_KEY` is set
4. **OpenAI** — if `OPENAI_API_KEY` is set

The first reachable provider wins. The chat panel's provider selector overrides this for chat-specific calls.

## Verifying the connection

When the bridge is active, you can verify it's being used by:

1. Opening the dashboard
2. Navigating to **Settings → AI Providers**
3. The active provider card shows which provider is currently selected

Or check the server logs in the terminal running `npm run dev`:
```
[AI] Active provider: mcp-bridge-claude (http://localhost:8960/mcp)
```

## Troubleshooting

### Bridge not detected

- Check that the bridge process is running (`ps aux | grep mcp`)
- Verify the port is correct (`curl http://localhost:8960/mcp`)
- Confirm the URL in `.env` matches exactly (no trailing slash)
- Restart `npm run dev` after changing `.env`

### Bridge detected but AI calls fail

- Check bridge logs for error output
- Verify the underlying model CLI is authenticated (Claude CLI, Codex, etc.)
- Try the bridge endpoint directly: `curl -X POST http://localhost:8960/mcp -H "Content-Type: application/json" -d '{"prompt":"hello"}'`

### Falling back to hosted API

If the bridge is configured but unreachable at startup, the dashboard falls back to the next available provider (typically Anthropic via `ANTHROPIC_API_KEY`). This fallback happens silently — useful for when you want to develop without the bridge running.

## Use cases

**Cost control during development:**
Run a Claude CLI bridge locally while building out your profile. Zero API cost while you iterate on your resume and add applications.

**Air-gapped environments:**
In security-sensitive situations where you don't want resume content leaving your network at all, run a local model through the bridge.

**Model comparison:**
Configure both a bridge and `ANTHROPIC_API_KEY`. Use the Settings page to switch between them and compare output quality for your specific resume content.
