import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const features = [
  {
    emoji: '🔗',
    title: 'Import from any job URL',
    description:
      'Paste a Greenhouse, Lever, LinkedIn, or Workday URL. The app fetches it server-side, strips nav/footer boilerplate with Mozilla Readability, and uses AI to extract company, role, location, salary, and the full job description — in under 10 seconds.',
  },
  {
    emoji: '📝',
    title: 'Resume builder with AI Auto-Improve',
    description:
      'Maintain a base resume and generate tailored copies per application. Click Auto-Improve and AI reviews every bullet point at once, proposes specific rewrites with explanations. You review each change before a single word is saved.',
  },
  {
    emoji: '🎯',
    title: 'Interview prep that knows your experience',
    description:
      'One click generates role-specific interview questions ranked by probability (High / Medium / Low), each with a STAR-format answer drawn from your actual work history — not generic ChatGPT filler.',
  },
  {
    emoji: '🏢',
    title: 'Automatic company profiles',
    description:
      'Provide the company URL. Click Generate. Get back company description, recent announcements, funding rounds, culture notes, and similar companies — sourced from the real website, cached locally so you only fetch once.',
  },
  {
    emoji: '💬',
    title: 'Context-aware AI career coach',
    description:
      'A streaming chat panel on every page. It automatically loads context from your current view — job description, linked resume, interview questions, or full library. Switch between Claude, GPT-4o mini, and Gemini in one click.',
  },
  {
    emoji: '🧠',
    title: 'Experience library',
    description:
      'Your master bank of career accomplishments, independent of any resume version. Reuse bullets across resumes without rewriting from memory. Add new achievements as you earn them; pull them into tailored resumes when the time comes.',
  },
  {
    emoji: '📋',
    title: 'Kanban application tracker',
    description:
      'Drag applications across Wishlist, Applied, Interviewing, Offer, and Rejected. Every card holds salary target, job description, notes, and linked resume — replacing the spreadsheet you\'ve been maintaining for months.',
  },
  {
    emoji: '🔒',
    title: 'Fully local and private',
    description:
      'SQLite database, no cloud sync, no third-party analytics. Your career data never leaves your machine. Only the AI API calls you make go out, directly to the provider you choose. Cancel any subscription.',
  },
  {
    emoji: '🔌',
    title: 'MCP Agent Bridge support',
    description:
      'Connect local AI models via the Model Context Protocol using mcp-agent-bridge. Route AI requests to locally-running models instead of hosted APIs — full cost control, complete privacy.',
  },
];

function Feature({ emoji, title, description }) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className={styles.featureCard}>
        <div className={styles.featureEmoji}>{emoji}</div>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center" style={{ marginBottom: '2rem' }}>
          <Heading as="h2">Everything you need to land the job</Heading>
          <p style={{ fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-700)' }}>
            Every feature is purpose-built for the job search workflow, not bolted on as an afterthought.
          </p>
        </div>
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
