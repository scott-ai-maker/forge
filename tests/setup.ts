// tests/setup.ts
// Global Vitest setup: configures default environment variables and test harnesses

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-test-project.supabase.co'
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stdGVzdC1wcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ2NzcsImV4cCI6MjA5MTMyMDY3N30.mock_test_anon_token_signature_placeholder'
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stdGVzdC1wcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0NDY3NywiZXhwIjoyMDkxMzIwNjc3fQ.mock_test_service_role_signature_placeholder'
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3000'
}

if (!process.env.APP_BASE_URL) {
  process.env.APP_BASE_URL = 'http://127.0.0.1:3000'
}

if (!process.env.ENABLE_DEMO_LOGIN) {
  process.env.ENABLE_DEMO_LOGIN = 'true'
}

if (!process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW) {
  process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW = 'true'
}

