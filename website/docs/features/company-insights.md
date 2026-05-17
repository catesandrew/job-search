---
id: company-insights
title: Company Insights
sidebar_position: 4
---

# Company Insights

Know the company before you walk in the door. One click fetches the company's own website and builds a structured brief — no Google rabbit holes, no stale Glassdoor summaries.

## What gets generated

Company Insights produces a structured profile with six sections:

| Section | What it covers |
|---|---|
| **About the Company** | Core business description, what they do, who they serve |
| **Recent Announcements** | News, product launches, leadership changes visible on the site |
| **Funding & Financials** | Funding rounds, investors, revenue signals, public/private status |
| **Culture & Values** | Mission statement, stated values, team culture signals |
| **Similar Companies** | Comparable companies in the same space |
| **Business Financials** | Revenue estimates, employee count, growth signals (when available) |

## Generating insights

1. Open an application and ensure the **Company URL** field is filled in (the company's homepage, not the job posting URL)
2. In the **About Company** section of the application, click **Generate Insights**
3. AI fetches the company website, extracts the main content, and produces the structured profile
4. The full Insights tab expands with all six sections

## Caching behavior

Insights are **generated once and cached** on the application record. Every time you open the application, the cached insights load instantly — no re-fetch required.

To refresh insights (e.g. before a second-round interview), click **Regenerate** to fetch the current site content and re-run the extraction.

## How it works

```
User clicks Generate Insights
  → POST /api/applications/{id}/insights
      1. Auth check
      2. Read companyUrl from application record
      3. Fetch company website server-side
      4. Extract main content with @mozilla/readability
      5. Convert to Markdown with turndown
      6. AI extracts structured fields as JSON:
         { description, recentAnnouncements, fundingRounds,
           businessFinancials, culture, similarCompanies, generatedAt }
      7. Save JSON to application.companyInsights column
  ← Cached insights returned on all subsequent reads
```

## Tips for best results

**Use the company homepage, not the job posting URL.** The company URL should point to the company's website (e.g. `https://anthropic.com`), not the ATS job board. The job posting lives on Greenhouse or Lever and won't have company background content.

**Generate before your phone screen, not the day of.** Insights take 10–20 seconds to generate. Generate them when you book the interview so they're ready when you need them.

**Check the "Recent Announcements" section before any interview.** Mentioning a recent company milestone ("I saw you just launched Claude 4...") signals genuine interest and research.

**"Similar Companies" is useful for negotiation.** Knowing competing companies in the space helps you understand the market and gives you context for salary discussions.

## When insights are limited

Some company sites are minimal, use heavy JavaScript rendering, or block server-side fetches. In these cases:

- The description will be shorter or more generic
- Funding/financial info may be missing (especially for stealth companies)
- Announcements may not be present

The app will still generate and cache whatever it can extract. You can supplement by editing the application notes manually.
