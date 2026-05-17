---
id: deployment
title: Deployment
sidebar_position: 5
---

# Deployment

Job Search Dashboard is a standard Next.js app — any platform that runs Next.js works. Below are the most common deployment options.

## Option 1: Vercel (recommended)

The fastest path to production. Vercel is built for Next.js.

### Steps

1. Push your fork to GitHub (already done if you cloned this repo)
2. Go to [vercel.com](https://vercel.com) and click **New Project**
3. Import your repository
4. Add environment variables in the Vercel dashboard (Settings → Environment Variables):

```env
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generated secret>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<your password>
ADMIN_NAME=Your Name
ANTHROPIC_API_KEY=sk-ant-...
```

5. Click **Deploy**

Vercel auto-detects Next.js, runs `npm run build`, and deploys.

:::warning SQLite on Vercel
Vercel's filesystem is ephemeral — SQLite data is lost on each deployment. For production use on Vercel, switch to a hosted database. See [Switching to PostgreSQL](#switching-to-postgresql) below.
:::

### Switching to PostgreSQL

```prisma title="prisma/schema.prisma"
datasource db {
  // highlight-next-line
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then set `DATABASE_URL` to a PostgreSQL connection string. Options:
- **[Neon](https://neon.tech)** — serverless Postgres, free tier
- **[PlanetScale](https://planetscale.com)** — MySQL-compatible, free tier
- **[Supabase](https://supabase.com)** — Postgres + extras, free tier
- **[Railway](https://railway.app)** — Simple Postgres hosting

Run migrations after switching:
```bash
npx prisma migrate deploy
```

---

## Option 2: Self-hosted (Node.js)

Run on any server with Node.js 20+.

```bash
# On your server
git clone https://github.com/catesandrew/job-search.git
cd job-search
npm install
cp .env.example .env
# Edit .env with production values
npm run db:migrate
npm run db:seed
npm run build
npm start
```

The app runs on port 3000 by default. Put it behind a reverse proxy (nginx, Caddy) for HTTPS.

### nginx example

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy example

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Caddy handles HTTPS automatically via Let's Encrypt.

### Process management

Use PM2 to keep the process running:

```bash
npm install -g pm2
pm2 start npm --name "job-search" -- start
pm2 save
pm2 startup
```

---

## Option 3: Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

Enable standalone output in `next.config.ts`:

```typescript
const config: NextConfig = {
  output: 'standalone',
}
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: file:./prisma/prod.db
      NEXTAUTH_URL: https://yourdomain.com
      NEXTAUTH_SECRET: your-secret
      ADMIN_EMAIL: you@example.com
      ADMIN_PASSWORD: your-password
      ADMIN_NAME: Your Name
      ANTHROPIC_API_KEY: sk-ant-...
    volumes:
      - ./data:/app/prisma
    restart: unless-stopped
```

Mount a volume to persist the SQLite database across container restarts.

---

## Environment checklist for production

- [ ] `NEXTAUTH_SECRET` is random and secret (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` is set to your actual domain (not localhost)
- [ ] `ADMIN_PASSWORD` is strong — this is the only auth gate
- [ ] `ANTHROPIC_API_KEY` is from a production key, not a test key
- [ ] SQLite database directory is persisted (volume mount or hosted DB)
- [ ] HTTPS is configured (Vercel handles this automatically; nginx/Caddy for self-hosted)

## Keeping it up to date

```bash
git pull origin main
npm install
npm run db:migrate
npm run build
pm2 restart job-search   # or redeploy on Vercel
```
