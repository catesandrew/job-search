import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  homepage: string | null
  private: boolean
  pushed_at: string | null
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patSetting = await prisma.setting.findUnique({ where: { key: 'github_pat' } })
    if (!patSetting?.value) {
      return NextResponse.json(
        { error: 'GitHub PAT not configured. Add it in Settings.' },
        { status: 400 }
      )
    }

    const headers = {
      Authorization: `Bearer ${patSetting.value}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'resume-app',
    }

    let allRepos: GithubRepo[] = []
    let page = 1
    while (true) {
      const res = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed&type=owner`,
        { headers }
      )
      if (!res.ok) {
        const err = await res.json() as { message?: string }
        return NextResponse.json(
          { error: `GitHub API error: ${err.message ?? res.statusText}` },
          { status: 400 }
        )
      }
      const repos = await res.json() as GithubRepo[]
      if (repos.length === 0) break
      allRepos = [...allRepos, ...repos]
      if (repos.length < 100) break
      page++
    }

    let synced = 0
    for (const repo of allRepos) {
      const data = {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        homepage: repo.homepage || null,
        isPrivate: repo.private,
        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        fetchedAt: new Date(),
      }
      await prisma.repository.upsert({
        where: { userId_githubId: { userId: session.user.id, githubId: repo.id } },
        create: { userId: session.user.id, githubId: repo.id, ...data },
        update: data,
      })
      synced++
    }

    return NextResponse.json({ synced })
  } catch (error) {
    console.error('POST /api/repositories/sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
