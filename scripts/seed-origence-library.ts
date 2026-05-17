/**
 * One-time seed: adds Origence LibraryExperience + bullets for Andrew Cates.
 * Run: npx tsx scripts/seed-origence-library.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const USER_ID = 'cmp7ocpc30000jo61nb975vhk' // catesandrew@gmail.com

const BULLETS = [
  // --- Strongest / high-impact ---
  'Led modernization of large Angular lending platforms across arcOS Admin, arcDX UI, and shared UI libraries, contributing heavily across Angular 20/21 upgrades, SSR readiness, package dependency alignment, and CI hardening.',
  'Built and hardened Playwright automation infrastructure for enterprise Angular applications, including reliable auth capture/reuse, shared auth fixtures, deterministic verification entrypoints, PR-gate execution, and reduced flaky test recovery paths.',
  'Improved CI/CD reliability and developer feedback loops by adding pipeline caching, test sharding, sourcemap uploads, Datadog version alignment, SonarQube gate hardening, Playwright reporting, and automated build/test diagnostics.',
  'Modernized the Baseline design system by expanding Tailwind-parity utility coverage, generating 166 reference documentation pages, adding VS Code developer tooling, and introducing validation/migration tools for consistent bl-* class usage.',
  'Created MCP and AI-assisted developer tooling for shared UI and design-system workflows, including documentation lookup, utility validation, Tailwind-to-Baseline translation, migration helpers, and offline knowledge-bundle support.',
  'Implemented SSR and security-hardening patterns for Angular applications, including CSP nonce propagation, secure header alignment, app-initialization loading strategies, SSR-safe storage/runtime config, and container runtime switching between SSR and SPA modes.',
  'Identified and remediated high-risk frontend security issues including token/credential exposure, unsafe window.open navigation, open redirects, cross-tab token exfiltration risks, stored XSS paths, unsandboxed iframe execution, and client-side permission override backdoors.',
  'Delivered CUDL3 migration features and supporting architecture for arcOS Admin, including lender vehicle valuation, loan calculation tools, app configuration, SmartApproval/SmartFund flows, membership eligibility, and frontend-to-backend proxy integration patterns.',
  'Reduced Angular test-suite cost and instability by profiling Jest runtime, replacing heavy component dependencies with shallow overrides, removing unused HTTP test modules across large spec sets, eliminating noisy console output, and experimenting with Jest/Vitest migration paths.',
  'Built observability improvements across frontend applications by standardizing Datadog DD_VERSION behavior, uploading Angular sourcemaps, improving diagnostic logging, and aligning git SHA/version metadata across build artifacts.',

  // --- Frontend Engineering & Architecture ---
  'Led Angular framework migrations from v17 → v21 across a multi-app monorepo, including ESLint flat config migration, standalone component conversion, and full dependency alignment across 5+ Angular projects.',
  'Enabled Angular Universal SSR for a consumer-facing loan origination app with CSP nonce bridging, Docker SSR/SPA runtime switching, security header alignment, and an SSR-safe PDF viewer.',
  'Built e-signature administration UI end-to-end (DocuSign + Kinective providers) with feature-flag gating, provider settings, REST options, consent messaging, form validation, and Storybook stories.',
  'Architected CUSO workflow routing rules editor with Angular CDK drag-and-drop, side-panel rule editing, exit path/task management, and queue branch assignment model.',
  'Rebuilt admin sidebar from 40+ flat links into a categorized, searchable, favoritable navigation with ⌘K command palette and recents tracking.',

  // --- Test Infrastructure ---
  'Executed three sequential test runner migrations across a large Angular workspace: Karma/Jasmine → Jest (549 spec files, ~25,000 lines changed) → Vitest (~18,400 tests, 904 spec files, 5 projects) — eliminating legacy test debt while maintaining full coverage.',
  'Hardened Playwright integration test suite with captured auth session reuse and visual regression testing against Storybook baselines.',

  // --- Observability & Monitoring ---
  'Migrated frontend observability from Azure Application Insights to Datadog RUM/Logs across multiple Angular apps; built 10 automated dashboard generation scripts, CI sourcemap upload pipelines, and allowed-tracing-URL management.',

  // --- Security ---
  'Remediated a cluster of critical security vulnerabilities in a single sprint: stored XSS in lender notes, JWT leakage via BroadcastChannel between browser tabs, webhook iframe srcdoc sandboxing, production devtools backdoor removal, and ReDoS fixes in shared dependencies.',

  // --- Developer Tooling & DX ---
  'Built arcdx-devtools Chrome extension with 10 diagnostic capabilities including stateful write tracing, key watchlist, request-to-state correlation, workflow path simulator, drift detector, redaction profiles, and bug bundle export.',
  'Built a full MCP (Model Context Protocol) server for a shared-ui monorepo with three runtime modes (live / bundle-snapshot / docs-only), offline source extraction, and a distributable knowledge bundle CLI.',
  'Published 4 VS Code extensions: arcdx-devtools, baseline-intellisense (17,000+ class registry entries with autocomplete), baseline-config-viewer, and baseline-fold.',
  'Built a full-stack admin export feature: Angular UI (reactive form, dirty-state tracking) + C# WCF backend (service, controller, DTOs, and unit tests) — 22 files, 2,586 lines.',

  // --- Design Systems ---
  'Expanded @cudirect/baseline SCSS utility library to near-Tailwind parity (state variants, dark mode, responsive breakpoints, gradients, transforms, filters); shipped prettier-plugin-baseline for class sorting and @cudirect/baseline-merge package.',
  'Translated entire Figma component library (28 components) into structured Markdown specs with full design token files (colors, spacing, typography, effects, breakpoints) and a 166-page CSS utility reference, architected for AI consumption.',

  // --- AI & Workflow Automation ---
  'Designed and built a Temporal.io durable workflow architecture for indirect auto loan origination lifecycle (origination → approval → funding → servicing) with a governed regeneration loop keeping docs, schema, and app data in sync.',
  'Built a Terminal UI dashboard (TypeScript / React / Ink) for AI development pipeline monitoring, shipped as native binaries for 5 platforms (macOS ARM64/x64, Linux x64/ARM64, Windows) via GitHub Actions, Homebrew formula, and curl-pipe installer.',
  'Published a shareable AI agent skills catalog (agentskills.io spec) covering Azure DevOps ticket workflows, Playwright testing, TSDoc generation, and commit messaging for Claude Code and OpenAI agents.',
  'Designed and exercised a disciplined AI-assisted development pipeline with full artifact trail per feature (PRD → design → plan → peer review → self-review → remediation → green build) across 12+ features in a .NET/C# REST API project.',
]

async function main() {
  // Check if experience already exists
  const existing = await prisma.libraryExperience.findFirst({
    where: { userId: USER_ID, company: 'Origence' },
  })

  if (existing) {
    console.log(`Origence experience already exists (id: ${existing.id}). Adding missing bullets...`)
    const existingBullets = await prisma.libraryBullet.findMany({
      where: { experienceId: existing.id },
      select: { content: true },
    })
    const existingContents = new Set(existingBullets.map((b: { content: string }) => b.content))
    const missing = BULLETS.filter(b => !existingContents.has(b))
    if (missing.length === 0) {
      console.log('All bullets already present. Nothing to add.')
      return
    }
    await prisma.libraryBullet.createMany({
      data: missing.map((content, i) => ({
        experienceId: existing.id,
        content,
        sortOrder: existingBullets.length + i,
      })),
    })
    console.log(`Added ${missing.length} new bullets.`)
    return
  }

  // Get current sortOrder max
  const maxSort = await prisma.libraryExperience.findFirst({
    where: { userId: USER_ID },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const experience = await prisma.libraryExperience.create({
    data: {
      userId: USER_ID,
      company: 'Origence',
      title: 'Principal Software Engineer',
      location: 'Remote',
      startDate: '2023',
      endDate: null,
      current: true,
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      bullets: {
        create: BULLETS.map((content, i) => ({ content, sortOrder: i })),
      },
    },
  })

  console.log(`✓ Created Origence experience (id: ${experience.id}) with ${BULLETS.length} bullets.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
