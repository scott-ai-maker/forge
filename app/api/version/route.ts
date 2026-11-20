import { NextResponse } from 'next/server'
import { APP_VERSION, APP_RELEASE_DATE } from '@/lib/app-version'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    name: 'Forge Athletic',
    version: APP_VERSION,
    releaseDate: APP_RELEASE_DATE,
    semver: `v${APP_VERSION}`,
  })
}
