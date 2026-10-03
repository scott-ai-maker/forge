import { NextResponse } from 'next/server'
import {
  APP_VERSION,
  APP_RELEASE_DATE,
  APP_RELEASE_CODENAME,
  getLatestRelease,
  RELEASE_LOG,
} from '@/lib/app-version'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    name: 'Gordon Athletic Advisory',
    version: APP_VERSION,
    releaseDate: APP_RELEASE_DATE,
    codename: APP_RELEASE_CODENAME,
    semver: `v${APP_VERSION}`,
    latestRelease: getLatestRelease(),
    totalReleases: RELEASE_LOG.length,
    documentationUrl: '/whats-new',
    changelogUrl: 'https://github.com/scott-ai-maker/gaa-app/blob/main/CHANGELOG.md',
  })
}
