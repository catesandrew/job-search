import { prisma } from '@/lib/prisma'
import { AnthropicProvider } from './anthropic-provider'
import { McpBridgeProvider } from './mcp-bridge-provider'
import type { AiProvider } from './provider'

async function getSetting(key: string): Promise<string | undefined> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting?.value ?? undefined
  } catch {
    return undefined
  }
}

async function buildProviders(): Promise<AiProvider[]> {
  const [anthropicKey, claudeMcpUrl, codexMcpUrl, copilotMcpUrl] = await Promise.all([
    getSetting('anthropic_api_key'),
    getSetting('mcp_claude_url'),
    getSetting('mcp_codex_url'),
    getSetting('mcp_copilot_url'),
  ])

  return [
    new AnthropicProvider(anthropicKey),
    new McpBridgeProvider({ id: 'mcp-claude', name: 'Claude MCP', preferredTool: 'ask' }, claudeMcpUrl),
    new McpBridgeProvider({ id: 'mcp-codex', name: 'Codex MCP', preferredTool: 'codex' }, codexMcpUrl),
    new McpBridgeProvider({ id: 'mcp-copilot', name: 'Copilot MCP', preferredTool: 'ask' }, copilotMcpUrl),
  ]
}

export async function getActiveProvider(): Promise<AiProvider | null> {
  const [selectedId, providers] = await Promise.all([
    getSetting('ai_provider'),
    buildProviders(),
  ])

  if (selectedId) {
    const selected = providers.find(p => p.id === selectedId)
    if (selected) {
      const available = await selected.isAvailable()
      if (available) return selected
    }
  }

  // Fall back to first available
  for (const provider of providers) {
    if (await provider.isAvailable()) return provider
  }

  return null
}

export async function listProviders(): Promise<
  Array<{ id: string; name: string; available: boolean }>
> {
  const providers = await buildProviders()
  const results = await Promise.all(
    providers.map(async p => ({
      id: p.id,
      name: p.name,
      available: await p.isAvailable(),
    }))
  )
  return results
}
