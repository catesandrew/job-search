import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HeroBanner() {
  return (
    <div className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Job Search Dashboard
        </Heading>
        <p className="hero__subtitle">
          Your AI-powered unfair advantage in the job search.
          <br />
          Track applications, tailor resumes, ace interviews — all from one local dashboard.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started"
          >
            Get Started in 5 Minutes ⚡
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://github.com/catesandrew/job-search"
            style={{ marginLeft: '1rem', color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            View on GitHub
          </Link>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>10s</span>
            <span className={styles.statLabel}>URL → Application</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>1-click</span>
            <span className={styles.statLabel}>AI Resume Improve</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>3 AI</span>
            <span className={styles.statLabel}>Providers Built In</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Your Data, Local</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className={styles.problemSection}>
      <div className="container">
        <div className={styles.problemGrid}>
          <div className={styles.problemContent}>
            <Heading as="h2">Sound familiar?</Heading>
            <ul className={styles.problemList}>
              <li>40 browser tabs and a spreadsheet that's already out of date</li>
              <li>A resume that "kind of" fits every job description but nails none</li>
              <li>Interview prep done the night before from memory</li>
              <li>20 minutes copying a job description you'll never read again</li>
              <li>No idea what's happening at the company you're interviewing with</li>
              <li>Paying $30/month for a SaaS that still doesn't know your experience</li>
            </ul>
          </div>
          <div className={styles.solutionContent}>
            <Heading as="h2">One dashboard fixes all of it.</Heading>
            <ul className={styles.solutionList}>
              <li>✅ Kanban board for every application in one view</li>
              <li>✅ Paste a URL → job imported in 10 seconds</li>
              <li>✅ AI rewrites your resume bullets for each specific role</li>
              <li>✅ One click generates full interview prep from your real experience</li>
              <li>✅ Automatic company profiles from the actual company website</li>
              <li>✅ Your data stays local — no subscriptions, no cloud sync</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickStartSection() {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div className="text--center">
          <Heading as="h2">Up and running in 5 minutes</Heading>
          <p className={styles.sectionSubtitle}>Three commands and you're tracking jobs with AI.</p>
        </div>
        <div className={styles.codeSteps}>
          <div className={styles.codeStep}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Clone & install</div>
              <pre className={styles.codeBlock}>{`git clone https://github.com/catesandrew/job-search.git
cd job-search && npm install`}</pre>
            </div>
          </div>
          <div className={styles.codeStep}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Configure your API key</div>
              <pre className={styles.codeBlock}>{`cp .env.example .env
# Edit .env: add ANTHROPIC_API_KEY + your login credentials`}</pre>
            </div>
          </div>
          <div className={styles.codeStep}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Start the app</div>
              <pre className={styles.codeBlock}>{`npm run db:migrate && npm run db:seed
npm run dev  # → http://localhost:3000`}</pre>
            </div>
          </div>
        </div>
        <div className="text--center" style={{ marginTop: '2rem' }}>
          <Link className="button button--primary button--lg" to="/docs/getting-started">
            Full setup guide →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="AI-powered job search dashboard — resume builder, application tracker, interview prep, and career coach chat"
    >
      <HeroBanner />
      <main>
        <HomepageFeatures />
        <ProblemSection />
        <QuickStartSection />
      </main>
    </Layout>
  );
}
