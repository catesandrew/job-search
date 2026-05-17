'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { type Application } from '@/hooks/use-applications'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  BarChart2,
  Building2,
  Pencil,
  RefreshCw,
  Megaphone,
  CircleDollarSign,
  Users,
} from 'lucide-react'
import { InterviewPrepTab } from '@/components/applications/interview-prep-tab'
import { useCompanyInsights, useGenerateCompanyInsights } from '@/hooks/use-mcp-tools'
import type { CompanyInsights } from '@/hooks/use-mcp-tools'

// ── Next steps per status ─────────────────────────────────────────────────────

type Step = { title: string; description: string; action: string }

const STEPS: Record<string, Step[]> = {
  WISHLIST: [
    {
      title: 'Be informed',
      description:
        "Take time to research companies you're interested in. Learning more can help you focus your job search effectively.",
      action: 'Research',
    },
    {
      title: 'Assess your fit',
      description:
        'Evaluate how your experience and values align with the company and role. Understanding your fit helps you make informed decisions.',
      action: 'Check fit',
    },
    {
      title: 'Reach out to current employees',
      description:
        'Connect with people at the company through LinkedIn or email. Building relationships can provide valuable insights.',
      action: 'Connect',
    },
  ],
  APPLIED: [
    {
      title: 'Follow up',
      description:
        "If you haven't heard back in a week, send a polite follow-up to express your continued interest.",
      action: 'Draft email',
    },
    {
      title: 'Prepare for interview',
      description:
        'Research common interview questions for this role and prepare concrete examples using the STAR method.',
      action: 'Practice',
    },
    {
      title: 'Research the team',
      description:
        'Look up the team and hiring manager on LinkedIn to understand team culture and background.',
      action: 'Research',
    },
  ],
  INTERVIEWING: [
    {
      title: 'Practice common questions',
      description:
        'Rehearse answers to behavioral and technical questions specific to this role.',
      action: 'Practice',
    },
    {
      title: 'Prepare your questions',
      description:
        'Prepare thoughtful questions to ask about the role, team, and company culture.',
      action: 'Prepare',
    },
    {
      title: 'Review your resume',
      description:
        'Be ready to discuss every item on your resume in detail, with specific examples.',
      action: 'Review',
    },
  ],
  OFFER: [
    {
      title: 'Review the offer carefully',
      description:
        'Read through all offer details — base salary, equity, benefits, signing bonus, and PTO.',
      action: 'Review',
    },
    {
      title: 'Research market rates',
      description:
        'Use Levels.fyi, Glassdoor, and Blind to confirm whether the offer is competitive.',
      action: 'Research',
    },
    {
      title: 'Negotiate',
      description:
        "Most companies expect candidates to negotiate. Come prepared with a counter backed by data.",
      action: 'Negotiate',
    },
  ],
  REJECTED: [
    {
      title: 'Request feedback',
      description:
        'Ask for feedback on your interview to learn and improve for future opportunities.',
      action: 'Email',
    },
    {
      title: 'Stay connected',
      description:
        'Add the recruiter and hiring manager on LinkedIn — roles open up again.',
      action: 'Connect',
    },
  ],
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NextSteps({ application }: { application: Application }) {
  const steps = STEPS[application.status] ?? []
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState(true)

  function toggle(i: number) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  const shown = expanded ? steps : steps.slice(0, 2)

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-border flex items-center justify-center">
          <div className="w-2 h-2 rounded-sm bg-muted-foreground/60" />
        </div>
        <span className="text-sm font-medium">Next Steps</span>
      </div>

      <div className="space-y-3">
        {shown.map((step, i) => (
          <div key={i} className="flex gap-3">
            <button
              onClick={() => toggle(i)}
              className={cn(
                'mt-0.5 w-4 h-4 shrink-0 rounded border transition-colors',
                checked[i]
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-border bg-transparent'
              )}
            >
              {checked[i] && (
                <svg viewBox="0 0 10 8" fill="none" className="w-full h-full p-0.5">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <div className="flex-1 space-y-1.5">
              <p className={cn('text-sm font-medium', checked[i] && 'line-through text-muted-foreground')}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => {
                  if (step.action === 'Research' && application.companyUrl) {
                    window.open(application.companyUrl, '_blank')
                  }
                }}
              >
                {step.action}
                <ExternalLink size={10} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {steps.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>Show less <ChevronUp size={12} /></>
          ) : (
            <>Show more <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  )
}

function AboutCompany({ application }: { application: Application }) {
  const initialInsights = application.companyInsights
    ? (() => { try { return JSON.parse(application.companyInsights) } catch { return null } })()
    : null
  const { data: insights } = useCompanyInsights(application.id, initialInsights)
  const generate = useGenerateCompanyInsights(application.id)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Building2 size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium">About {application.company}</span>
        <span className="text-xs text-muted-foreground">Company briefings and information.</span>
      </div>

      <div className="rounded-lg border border-border bg-card/20 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{application.company}</p>
            {application.companyUrl ? (
              <a
                href={application.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
              >
                {application.companyUrl.replace(/^https?:\/\//, '')}
                <ExternalLink size={10} />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">No website set</p>
            )}
          </div>
        </div>

        {insights?.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{insights.description}</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {generate.isPending ? 'Generating company info…' : 'No company description yet.'}
            </p>
            {!generate.isPending && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                onClick={() => generate.mutate()}
              >
                <Brain size={11} />
                Generate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InsightSection({ title, items }: { title: string; items: { text: string }[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!items || items.length === 0) return null
  const visible = expanded ? items : items.slice(0, 2)
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <ul className="space-y-1.5">
        {visible.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
      {items.length > 2 && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : `Show ${items.length - 2} more`}
        </button>
      )}
    </div>
  )
}

function Insights({ application }: { application: Application }) {
  const initialInsights = application.companyInsights
    ? (() => { try { return JSON.parse(application.companyInsights) } catch { return null } })()
    : null
  const { data: insights } = useCompanyInsights(application.id, initialInsights)
  const generate = useGenerateCompanyInsights(application.id)
  const [cultureExpanded, setCultureExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <BarChart2 size={14} className="text-orange-400" />
        <span className="text-sm font-medium">Insights</span>
        <span className="text-xs text-muted-foreground">Latest news and insights about the company.</span>
      </div>

      {!insights ? (
        <div className="rounded-lg border border-border bg-card/20 p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground">
            Generate AI-synthesized insights about {application.company} — recent news, funding, culture, and competitors.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            <BarChart2 size={12} className={cn(generate.isPending && 'animate-pulse', 'text-orange-400')} />
            {generate.isPending ? 'Generating…' : 'Generate Insights'}
          </Button>
          {generate.error && (
            <p className="text-xs text-destructive">{(generate.error as Error).message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Announcements */}
            {insights.recentAnnouncements?.length > 0 && (
              <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone size={13} className="text-red-400 shrink-0" />
                  <p className="text-sm font-medium">Recent Announcements</p>
                </div>
                <InsightSection title="" items={insights.recentAnnouncements} />
              </div>
            )}

            {/* Funding & Financials */}
            {(insights.fundingRounds?.length > 0 || insights.businessFinancials?.length > 0) && (
              <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={13} className="text-blue-400 shrink-0" />
                  <p className="text-sm font-medium">Funding and Financials</p>
                </div>
                {insights.fundingRounds?.length > 0 && (
                  <InsightSection title="Funding Rounds" items={insights.fundingRounds} />
                )}
                {insights.businessFinancials?.length > 0 && (
                  <InsightSection title="Business and Financials" items={insights.businessFinancials} />
                )}
              </div>
            )}

            {/* Culture */}
            {insights.culture && (
              <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-green-400 shrink-0" />
                  <p className="text-sm font-medium">Company Culture</p>
                </div>
                <p className="text-sm">
                  {cultureExpanded || insights.culture.length <= 180
                    ? insights.culture
                    : insights.culture.slice(0, 180) + '…'}
                </p>
                {insights.culture.length > 180 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setCultureExpanded((e) => !e)}
                  >
                    {cultureExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Similar Companies */}
            {insights.similarCompanies?.length > 0 && (
              <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-purple-400 shrink-0" />
                  <p className="text-sm font-medium">Similar Companies</p>
                </div>
                <ul className="space-y-1.5">
                  {insights.similarCompanies.map((c: CompanyInsights['similarCompanies'][number], i: number) => (
                    <li key={i} className="flex gap-2 text-sm items-center">
                      <span className="shrink-0 mt-0 w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span>{c.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Generated {new Date(insights.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}AI-synthesized from training data
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-7 text-muted-foreground"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              <RefreshCw size={11} className={cn(generate.isPending && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const MESSAGE_TYPES = [
  { id: 'cold', label: 'Cold', description: 'a cold outreach' },
  { id: 'follow-up', label: 'Follow Up', description: 'a follow-up' },
  { id: 'thank-you', label: 'Thank You', description: 'a thank-you' },
] as const

type MessageType = (typeof MESSAGE_TYPES)[number]['id']

function GenerateMessage({ company, applicationId }: { company: string; applicationId: string }) {
  const [type, setType] = useState<MessageType>('cold')
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const current = MESSAGE_TYPES.find((t) => t.id === type)!

  const generate = useMutation({
    mutationFn: async (msgType: MessageType) => {
      const res = await fetch(`/api/applications/${applicationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: msgType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Generation failed')
      return json.data.message as string
    },
    onSuccess: (msg: string) => setMessage(msg),
  })

  const handleCopy = async () => {
    if (!message) return
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectType = (t: MessageType) => {
    setType(t)
    setMessage(null)
    generate.reset()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Generate a message to send to contacts at {company}.
      </p>
      <div className="flex gap-2">
        {MESSAGE_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => selectType(t.id)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-md border transition-colors',
              type === t.id
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!message && !generate.isPending && (
        <div className="rounded-lg border border-border bg-card/20 p-6 flex flex-col items-center gap-3 text-center">
          <Pencil size={18} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Click Generate to create {current.description} message for {company}.
          </p>
          <Button size="sm" variant="outline" onClick={() => generate.mutate(type)}>
            Generate
          </Button>
          {generate.isError && (
            <p className="text-xs text-destructive">{(generate.error as Error).message}</p>
          )}
        </div>
      )}

      {generate.isPending && (
        <div className="rounded-lg border border-border bg-card/20 p-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}

      {message && !generate.isPending && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card/20 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={() => generate.mutate(type)}
            >
              <RefreshCw size={12} /> Regenerate
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleCopy}>
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ApplicationOverview({ application }: { application: Application }) {
  return (
    <div className="flex-1 overflow-auto border-r border-border">
      <Tabs defaultValue="overview" className="h-full flex flex-col">
        <div className="border-b border-border px-6 shrink-0">
          <TabsList className="h-10 bg-transparent gap-4 p-0 rounded-none">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 px-0 text-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="prep"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 px-0 text-sm flex items-center gap-1"
            >
              <Brain size={13} />
              Interview Prep
            </TabsTrigger>
            <TabsTrigger
              value="message"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 px-0 text-sm"
            >
              Generate Message
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="prep" className="flex-1 overflow-auto mt-0">
          <InterviewPrepTab
            applicationId={application.id}
            hasJobDescription={!!application.jobDescription}
            interviewQuestions={JSON.parse(application.interviewQuestions ?? '[]') as string[]}
          />
        </TabsContent>

        <TabsContent value="overview" className="flex-1 overflow-auto px-6 py-5 space-y-6 mt-0">
          <NextSteps application={application} />
          <AboutCompany application={application} />
          <Insights application={application} />
        </TabsContent>

        <TabsContent value="message" className="flex-1 overflow-auto px-6 py-5 mt-0">
          <GenerateMessage company={application.company} applicationId={application.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
