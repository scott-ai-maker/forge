'use client'

import Link from 'next/link'
import { trackMarketingEvent, type MarketingEventPayload } from '@/lib/marketing-analytics'

type TrackedCtaLinkProps = {
  href: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  eventName: string
  eventPayload?: MarketingEventPayload
  ariaLabel?: string
  'aria-label'?: string
  target?: string
  rel?: string
}

export default function TrackedCtaLink({
  href,
  className,
  style,
  children,
  eventName,
  eventPayload,
  ariaLabel,
  'aria-label': ariaLabelAttr,
  target,
  rel,
}: TrackedCtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      target={target}
      rel={rel}
      aria-label={ariaLabel || ariaLabelAttr}
      onClick={() => trackMarketingEvent(eventName, eventPayload)}
    >
      {children}
    </Link>
  )
}
