---
id: url-import
title: URL Import
sidebar_position: 1
---

# Import Applications from a URL

The fastest way to add a job application. Paste a URL — the app fetches the posting, extracts every field, and pre-fills the form. What used to take 10 minutes takes 10 seconds.

## Supported sites

Works with any job posting that renders content in HTML. Tested on:

- **Greenhouse** (greenhouse.io job boards)
- **Lever** (jobs.lever.co)
- **LinkedIn** (linkedin.com/jobs)
- **Workday** (myworkdayjobs.com)
- **Company career pages** (most sites)

If a site uses client-side rendering that requires JavaScript execution, the extraction may be incomplete — the form will still open, just with fewer pre-filled fields.

## How to use it

1. Open a job posting in your browser
2. Copy the URL
3. In the dashboard, go to **Applications → New Application**
4. Paste the URL into the **Import from URL** field at the top of the page
5. Click **Import**
6. While importing, a loading skeleton covers the form
7. On success, all extracted fields are pre-filled — review them, make any edits, then click **Save**

## What gets extracted

| Field | Source |
|---|---|
| Company name | AI extraction from page content |
| Role/title | AI extraction |
| Location | AI extraction (remote, hybrid, city) |
| Salary min/max | AI extraction (converted to annual USD integers) |
| Salary frequency | yearly / monthly / hourly |
| Company URL | AI extraction |
| Job description | Full page content as clean Markdown |

All fields are **best-effort** — at minimum `company` and `role` will be populated. Salary is often not present in job postings and will be left blank when not found.

## How it works under the hood

```
User pastes URL
  → POST /api/applications/import-url
      1. Auth check (session required)
      2. Validate URL (must be http/https)
      3. Fetch URL server-side with browser User-Agent header
      4. Parse HTML with @mozilla/readability → extract article content
         (same engine as Firefox Reader View — strips nav, footer, sidebar)
      5. Fall back to full HTML if Readability finds no article
      6. Convert article HTML → clean Markdown (turndown)
      7. Call AI with Markdown to extract structured fields as JSON
      8. Return { company, role, location, salaryMin, salaryMax, ... }
  ← Pre-fills form fields
```

The job description stored in the application is the **full Markdown output** from the page — not just the AI-extracted summary. You always have the complete original posting.

## Error handling

| Error | What happens |
|---|---|
| URL unreachable / blocked | Toast: "Failed to fetch job posting. Check the URL and try again." |
| No content extracted | Toast: "Could not extract content from this URL. Try pasting the job description manually." |
| AI extraction fails | Toast: "Import failed. Try again or fill in the form manually." |
| Invalid URL format | Import button stays disabled until a valid http/https URL is entered |

## Tips

- Some company sites block server-side fetches with bot detection. If import fails, paste the job description text directly into the Job Description field.
- Greenhouse and Lever are the most reliable sources — they're static HTML and load fully server-side.
- LinkedIn often returns a login wall for unauthenticated fetches — the job description may be partial.
