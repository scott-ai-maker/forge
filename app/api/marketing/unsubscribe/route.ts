import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken, suppressEmail } from '@/lib/marketing-email'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim().toLowerCase()
  const token = searchParams.get('token')?.trim()

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return new NextResponse(
      renderUnsubscribeHtml({
        success: false,
        message: 'Invalid or expired unsubscribe link. Please verify the URL or contact advisory support.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  try {
    const supabase = supabaseAdmin()
    await suppressEmail(supabase, email, 'unsubscribed')

    return new NextResponse(
      renderUnsubscribeHtml({
        success: true,
        email,
        message: 'You have been successfully removed from Gordon Athletic Advisory communications.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  } catch (err) {
    console.error('Unsubscribe processing error:', err)
    return new NextResponse(
      renderUnsubscribeHtml({
        success: false,
        message: 'A temporary error occurred while processing your request. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}

// RFC 8058 One-Click List-Unsubscribe handler (invoked by Gmail / Yahoo / Apple Mail)
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim().toLowerCase()
  const token = searchParams.get('token')?.trim()

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Invalid or missing unsubscribe token' }, { status: 400 })
  }

  try {
    const supabase = supabaseAdmin()
    await suppressEmail(supabase, email, 'unsubscribed')
    return NextResponse.json({ success: true, email })
  } catch (err) {
    console.error('RFC 8058 POST unsubscribe error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function renderUnsubscribeHtml(params: {
  success: boolean
  email?: string
  message: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.success ? 'Unsubscribed' : 'Error'} | Gordon Athletic Advisory</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #080E14;
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: rgba(14, 23, 36, 0.95);
      border: 1px solid rgba(197, 160, 89, 0.35);
      border-radius: 12px;
      padding: 40px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    }
    .brand-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #C5A059;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 26px;
      margin: 0 0 16px;
      color: #FFFFFF;
      font-weight: 700;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 24px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 18px;
      background: ${params.success ? 'rgba(72, 187, 120, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      color: ${params.success ? '#48BB78' : '#EF4444'};
      border: 1px solid ${params.success ? 'rgba(72, 187, 120, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
    }
    .btn {
      display: inline-block;
      padding: 10px 22px;
      background: #C5A059;
      color: #080E14;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.06em;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-title">Gordon Athletic Advisory</div>
    <div class="status-badge">${params.success ? 'Confirmed' : 'Error'}</div>
    <h1>${params.success ? 'Unsubscribe Confirmed' : 'Request Error'}</h1>
    <p>${params.message}</p>
    ${params.email ? `<p style="font-size: 13px; color: #64748B;">Account: <strong>${params.email}</strong></p>` : ''}
    <a href="/" class="btn">Return to Advisory Home</a>
  </div>
</body>
</html>`
}

