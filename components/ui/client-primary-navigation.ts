import type { GaaIconName } from '@/components/ui/GaaIcon'

export const CLIENT_PRIMARY_NAV = [
  { id: 'today', href: '/dashboard', label: 'Today', icon: 'crown' },
  { id: 'training', href: '/dashboard/fitness?workspace=train', label: 'Train', icon: 'barbell' },
  { id: 'progress', href: '/dashboard/fitness?workspace=progress', label: 'Progress', icon: 'chart' },
  { id: 'coach', href: '/dashboard/fitness?workspace=coach', label: 'Coach', icon: 'message' },
] as const satisfies ReadonlyArray<{
  id: 'today' | 'training' | 'progress' | 'coach'
  href: string
  label: string
  icon: GaaIconName
}>

export type ClientPrimaryNavId = (typeof CLIENT_PRIMARY_NAV)[number]['id']

export function isClientPrimaryNavItemActive(
  id: ClientPrimaryNavId,
  pathname: string,
  workspace: string | null
): boolean {
  if (id === 'today') return pathname === '/dashboard'

  if (id === 'coach') {
    return (
      (pathname === '/dashboard/fitness' && workspace === 'coach') ||
      pathname === '/dashboard/messages' ||
      pathname === '/dashboard/live' ||
      pathname === '/dashboard/book'
    )
  }

  if (id === 'progress' && pathname === '/dashboard/dossier') return true
  if (!pathname.startsWith('/dashboard/fitness')) return false

  if (id === 'progress') return workspace === 'progress'
  return workspace !== 'progress' && workspace !== 'coach'
}
