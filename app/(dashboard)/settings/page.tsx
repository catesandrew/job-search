'use client'

import { useRef, useState, useEffect } from 'react'
import { Settings, Download, Upload, FileJson, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProviderStatus {
  id: string
  name: string
  available: boolean
  selected: boolean
}

function AvailabilityDot({ status }: { status: 'checking' | 'available' | 'unavailable' }) {
  if (status === 'checking') {
    return <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
  }
  if (status === 'available') {
    return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
  }
  return <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
}

type ImportResult = { ok: true; message: string } | { ok: false; error: string }

function ExportRow({
  label,
  description,
  icon: Icon,
  href,
}: {
  label: string
  description: string
  icon: React.ElementType
  href: string
}) {
  return (
    <a
      href={href}
      download
      className="flex items-center gap-3 rounded-lg border border-border bg-card/20 px-4 py-3 hover:bg-card/50 transition-colors group"
    >
      <Icon size={15} className="text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Download size={13} className="text-muted-foreground shrink-0" />
    </a>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  async function handleImportFile(file: File) {
    setImportResult(null)
    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/import', { method: 'POST', body: form })
      const json = await res.json()
      if (res.ok) {
        setImportResult({ ok: true, message: json.message })
        queryClient.invalidateQueries()
      } else {
        setImportResult({ ok: false, error: json.error ?? 'Import failed' })
      }
    } catch {
      setImportResult({ ok: false, error: 'Network error during import' })
    } finally {
      setImporting(false)
    }
  }

  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const [anthropicKey, setAnthropicKey] = useState('')
  const [anthropicKeySaving, setAnthropicKeySaving] = useState(false)
  const [anthropicKeySaved, setAnthropicKeySaved] = useState(false)
  const [anthropicKeyMasked, setAnthropicKeyMasked] = useState<string | null>(null)

  const [githubPat, setGithubPat] = useState('')
  const [githubPatSaving, setGithubPatSaving] = useState(false)
  const [githubPatSaved, setGithubPatSaved] = useState(false)
  const [githubPatMasked, setGithubPatMasked] = useState<string | null>(null)
  const [githubPatError, setGithubPatError] = useState<string | null>(null)

  const [claudeMcpUrl, setClaudeMcpUrl] = useState('')
  const [claudeMcpSaving, setClaudeMcpSaving] = useState(false)
  const [claudeMcpSaved, setClaudeMcpSaved] = useState(false)
  const [claudeMcpCurrent, setClaudeMcpCurrent] = useState<string | null>(null)

  const [codexMcpUrl, setCodexMcpUrl] = useState('')
  const [codexMcpSaving, setCodexMcpSaving] = useState(false)
  const [codexMcpSaved, setCodexMcpSaved] = useState(false)
  const [codexMcpCurrent, setCodexMcpCurrent] = useState<string | null>(null)

  const [copilotMcpUrl, setCopilotMcpUrl] = useState('')
  const [copilotMcpSaving, setCopilotMcpSaving] = useState(false)
  const [copilotMcpSaved, setCopilotMcpSaved] = useState(false)
  const [copilotMcpCurrent, setCopilotMcpCurrent] = useState<string | null>(null)

  const [providerSaving, setProviderSaving] = useState(false)

  const fetchProviders = async () => {
    setProvidersLoading(true)
    try {
      const res = await fetch('/api/ai/providers')
      if (res.ok) {
        const json = await res.json()
        setProviders(json.data)
        const sel = json.data.find((p: ProviderStatus) => p.selected)
        if (sel) setSelectedProvider(sel.id)
      }
    } finally {
      setProvidersLoading(false)
    }
  }

  const fetchCurrentSettings = async () => {
    try {
      const [keyRes, claudeRes, codexRes, copilotRes, githubRes] = await Promise.all([
        fetch('/api/settings/anthropic_api_key'),
        fetch('/api/settings/mcp_claude_url'),
        fetch('/api/settings/mcp_codex_url'),
        fetch('/api/settings/mcp_copilot_url'),
        fetch('/api/settings/github_pat'),
      ])
      if (keyRes.ok) {
        const json = await keyRes.json()
        const val: string = json.data?.value ?? ''
        if (val) setAnthropicKeyMasked(val.slice(0, 8) + '...')
      }
      if (githubRes.ok) {
        const json = await githubRes.json()
        const val: string = json.data?.value ?? ''
        if (val) setGithubPatMasked(val.slice(0, 8) + '...')
      }
      if (claudeRes.ok) {
        const json = await claudeRes.json()
        setClaudeMcpCurrent(json.data?.value ?? null)
      }
      if (codexRes.ok) {
        const json = await codexRes.json()
        setCodexMcpCurrent(json.data?.value ?? null)
      }
      if (copilotRes.ok) {
        const json = await copilotRes.json()
        setCopilotMcpCurrent(json.data?.value ?? null)
      }
    } catch {
      // settings may not exist yet
    }
  }

  useEffect(() => {
    fetchProviders()
    fetchCurrentSettings()
  }, [])

  const upsertSetting = async (key: string, value: string) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error((json as { error?: string }).error ?? 'Failed to save')
    }
  }

  const saveAnthropicKey = async () => {
    if (!anthropicKey.trim()) return
    setAnthropicKeySaving(true)
    try {
      await upsertSetting('anthropic_api_key', anthropicKey.trim())
      setAnthropicKeyMasked(anthropicKey.trim().slice(0, 8) + '...')
      setAnthropicKey('')
      setAnthropicKeySaved(true)
      setTimeout(() => setAnthropicKeySaved(false), 2000)
    } finally {
      setAnthropicKeySaving(false)
    }
  }

  const saveGithubPat = async () => {
    if (!githubPat.trim()) return
    setGithubPatSaving(true)
    setGithubPatError(null)
    try {
      await upsertSetting('github_pat', githubPat.trim())
      setGithubPatMasked(githubPat.trim().slice(0, 8) + '...')
      setGithubPat('')
      setGithubPatSaved(true)
      setTimeout(() => setGithubPatSaved(false), 2000)
    } catch (err) {
      setGithubPatError(err instanceof Error ? err.message : 'Failed to save token')
    } finally {
      setGithubPatSaving(false)
    }
  }

  const makeMcpSaver = (
    key: string,
    url: string,
    setCurrent: (v: string) => void,
    setUrl: (v: string) => void,
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void,
  ) => async () => {
    if (!url.trim()) return
    setSaving(true)
    try {
      await upsertSetting(key, url.trim())
      setCurrent(url.trim())
      setUrl('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const saveClaudeMcpUrl = makeMcpSaver('mcp_claude_url', claudeMcpUrl, setClaudeMcpCurrent, setClaudeMcpUrl, setClaudeMcpSaving, setClaudeMcpSaved)
  const saveCodexMcpUrl = makeMcpSaver('mcp_codex_url', codexMcpUrl, setCodexMcpCurrent, setCodexMcpUrl, setCodexMcpSaving, setCodexMcpSaved)
  const saveCopilotMcpUrl = makeMcpSaver('mcp_copilot_url', copilotMcpUrl, setCopilotMcpCurrent, setCopilotMcpUrl, setCopilotMcpSaving, setCopilotMcpSaved)

  const saveSelectedProvider = async (id: string) => {
    setSelectedProvider(id)
    setProviderSaving(true)
    try {
      await upsertSetting('ai_provider', id)
    } finally {
      setProviderSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Configure AI providers and preferences
      </p>

      {/* AI Provider Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">AI Provider</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchProviders}
            disabled={providersLoading}
          >
            Check Status
          </Button>
        </div>

        {providersLoading ? (
          <p className="text-sm text-muted-foreground">Checking provider status...</p>
        ) : (
          <div className="space-y-3">
            {providers.map(provider => (
              <label
                key={provider.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="ai_provider"
                  value={provider.id}
                  checked={selectedProvider === provider.id}
                  onChange={() => saveSelectedProvider(provider.id)}
                  disabled={providerSaving}
                  className="accent-primary"
                />
                <AvailabilityDot
                  status={provider.available ? 'available' : 'unavailable'}
                />
                <span className="text-sm font-medium">{provider.name}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    provider.available
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {provider.available ? 'Available' : 'Unavailable'}
                </Badge>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Anthropic Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-base font-semibold mb-1">Anthropic</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your Anthropic API key to use Claude for resume optimization.
        </p>
        {anthropicKeyMasked && (
          <p className="text-xs text-muted-foreground mb-3">
            Current key: <span className="font-mono">{anthropicKeyMasked}</span>
          </p>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="anthropic-key" className="sr-only">
              API Key
            </Label>
            <Input
              id="anthropic-key"
              type="password"
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              onKeyDown={e => e.key === 'Enter' && saveAnthropicKey()}
            />
          </div>
          <Button
            type="button"
            onClick={saveAnthropicKey}
            disabled={anthropicKeySaving || !anthropicKey.trim()}
            className="shrink-0"
          >
            {anthropicKeySaved ? 'Saved!' : anthropicKeySaving ? 'Saving...' : 'Save Key'}
          </Button>
        </div>
      </Card>

      {/* GitHub Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-base font-semibold mb-1">GitHub</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add a personal access token to sync your repositories to your resumes.
        </p>
        {githubPatMasked && (
          <p className="text-xs text-muted-foreground mb-3">
            Current token: <span className="font-mono">{githubPatMasked}</span>
          </p>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="github-pat" className="sr-only">
              Personal Access Token
            </Label>
            <Input
              id="github-pat"
              type="password"
              value={githubPat}
              onChange={e => setGithubPat(e.target.value)}
              placeholder="ghp_..."
              onKeyDown={e => e.key === 'Enter' && saveGithubPat()}
            />
          </div>
          <Button
            type="button"
            onClick={saveGithubPat}
            disabled={githubPatSaving || !githubPat.trim()}
            className="shrink-0"
          >
            {githubPatSaved ? 'Saved!' : githubPatSaving ? 'Saving...' : 'Save Token'}
          </Button>
        </div>
        {githubPatError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{githubPatError}</span>
          </div>
        )}
      </Card>

      {/* Export Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-base font-semibold mb-1">Export Data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Download your applications and resumes.
        </p>
        <div className="space-y-2">
          <ExportRow
            label="Full backup (JSON)"
            description="All applications and resumes — use to back up or migrate"
            icon={FileJson}
            href="/api/export?type=all"
          />
          <ExportRow
            label="Applications (CSV)"
            description="Open in Excel or Google Sheets"
            icon={FileSpreadsheet}
            href="/api/export?type=applications&format=csv"
          />
          <ExportRow
            label="Applications (JSON)"
            description="Machine-readable, re-importable format"
            icon={FileJson}
            href="/api/export?type=applications"
          />
          <ExportRow
            label="Resumes (JSON)"
            description="All resume data including positions, bullets, and skills"
            icon={FileJson}
            href="/api/export?type=resumes"
          />
        </div>
      </Card>

      {/* Import Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-base font-semibold mb-1">Import Data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a <strong>.json</strong> backup or <strong>.csv</strong> file. Existing data is preserved.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImportFile(file)
            e.target.value = ''
          }}
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleImportFile(file)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
            dragging
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-border hover:border-border/60 hover:bg-muted/20'
          )}
        >
          {importing ? (
            <Loader2 size={22} className="text-muted-foreground animate-spin" />
          ) : (
            <Upload size={22} className="text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {importing ? 'Importing…' : 'Drop a file or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">.json or .csv</p>
          </div>
        </div>

        {importResult && (
          <div
            className={cn(
              'mt-3 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
              importResult.ok
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            )}
          >
            {importResult.ok
              ? <CheckCircle size={15} className="shrink-0 mt-0.5" />
              : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
            <span>{importResult.ok ? importResult.message : importResult.error}</span>
          </div>
        )}
      </Card>

      {/* MCP Bridge Section */}
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-1">MCP Bridge Servers</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Configure the MCP Streamable HTTP endpoint for each AI bridge server.
        </p>
        <div className="space-y-5">
          {([
            { label: 'Claude MCP', id: 'claude-mcp-url', current: claudeMcpCurrent, value: claudeMcpUrl, setValue: setClaudeMcpUrl, save: saveClaudeMcpUrl, saving: claudeMcpSaving, saved: claudeMcpSaved },
            { label: 'Codex MCP', id: 'codex-mcp-url', current: codexMcpCurrent, value: codexMcpUrl, setValue: setCodexMcpUrl, save: saveCodexMcpUrl, saving: codexMcpSaving, saved: codexMcpSaved },
            { label: 'Copilot MCP', id: 'copilot-mcp-url', current: copilotMcpCurrent, value: copilotMcpUrl, setValue: setCopilotMcpUrl, save: saveCopilotMcpUrl, saving: copilotMcpSaving, saved: copilotMcpSaved },
          ] as const).map(({ label, id, current, value, setValue, save, saving, saved }) => (
            <div key={id}>
              <p className="text-sm font-medium mb-1">{label}</p>
              {current && (
                <p className="text-xs text-muted-foreground mb-2">
                  Current: <span className="font-mono">{current}</span>
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  id={id}
                  type="url"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="http://localhost:8960/mcp"
                  onKeyDown={e => e.key === 'Enter' && save()}
                />
                <Button
                  type="button"
                  onClick={save}
                  disabled={saving || !value.trim()}
                  className="shrink-0"
                >
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
