import { NextResponse } from 'next/server'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const

function retiredResponse() {
  return NextResponse.json(
    {
      error:
        'AI physique simulation (predict-look) has been permanently retired under Forge Athletic Biometric Privacy & Athlete Safety Standards.',
      code: 'PREDICT_LOOK_RETIRED',
    },
    { status: 410, headers: NO_STORE_HEADERS }
  )
}

export async function GET() {
  return retiredResponse()
}

export async function POST() {
  return retiredResponse()
}
