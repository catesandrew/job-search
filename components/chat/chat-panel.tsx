'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MessageCircle, X, Send, RotateCcw, ChevronDown, Loader2 } from 'lucide-react'
import type { ChatProvider } from '@/app/api/chat/route'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const PROVIDERS: { id: ChatProvider; label: string; color: string }[] = [
  { id: 'anthropic', label: 'Claude', color: 'text-orange-400' },
  { id: 'openai', label: 'GPT', color: 'text-green-400' },
  { id: 'google', label: 'Gemini', color: 'text-blue-400' },
]

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  '/applications': [
    'What gaps do I have for this role?',
    'Help me prep for this interview',
    'Draft a follow-up email',
  ],
  '/resumes': [
    'How can I improve this resume?',
    'Quantify my achievements',
    'Tailor this for a senior role',
  ],
  '/library': [
    'What STAR stories do I have?',
    'Help me write a new achievement bullet',
    'What skills am I missing?',
  ],
  '/cover-letters': [
    'Review my cover letter',
    'Make it more concise',
    'Strengthen the opening paragraph',
  ],
  default: [
    'Which application should I focus on?',
    'Help me improve my resume',
    'How do I negotiate salary?',
  ],
}

function getSuggestedPrompts(pathname: string): string[] {
  for (const [key, prompts] of Object.entries(SUGGESTED_PROMPTS)) {
    if (key !== 'default' && pathname.startsWith(key)) return prompts
  }
  return SUGGESTED_PROMPTS.default
}

function MarkdownText({ text }: { text: string }) {
  // Minimal inline markdown: **bold**, `code`, bullet lists
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const isBullet = /^[-•*]\s/.test(line)
        const content = line.replace(/^[-•*]\s/, '')
        const rendered = content
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')

        if (isBullet) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-current opacity-50" />
              <span dangerouslySetInnerHTML={{ __html: rendered }} />
            </div>
          )
        }
        if (!line.trim()) return <div key={i} className="h-2" />
        return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />
      })}
    </div>
  )
}

export function ChatPanel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<ChatProvider>('anthropic')
  const [showProviders, setShowProviders] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return
    const userMsg: Message = { role: 'user', content: content.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, pathname, provider }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' }
          return updated
        })
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [messages, loading, pathname, provider])

  const currentProvider = PROVIDERS.find(p => p.id === provider)!
  const suggested = getSuggestedPrompts(pathname)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          open && 'scale-90 opacity-0 pointer-events-none',
        )}
        aria-label="Open AI chat"
      >
        <MessageCircle size={20} />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-5 right-5 z-50 w-[380px] flex flex-col rounded-xl border border-border bg-background shadow-2xl transition-all duration-200',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        )}
        style={{ height: '560px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-primary" />
            <span className="text-sm font-semibold">Career Coach</span>
            {/* Provider selector */}
            <div className="relative">
              <button
                onClick={() => setShowProviders(v => !v)}
                className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border hover:bg-muted transition-colors', currentProvider.color)}
              >
                {currentProvider.label}
                <ChevronDown size={10} />
              </button>
              {showProviders && (
                <div className="absolute left-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-10 min-w-[100px]">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setProvider(p.id); setShowProviders(false) }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                        p.color,
                        provider === p.id && 'bg-muted font-medium',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Clear chat"
              title="New chat"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Close chat"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground text-center pt-2">
                Ask anything about your job search, resume, or interview prep.
              </p>
              <div className="space-y-2">
                {suggested.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  )
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 h-9 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3"
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
