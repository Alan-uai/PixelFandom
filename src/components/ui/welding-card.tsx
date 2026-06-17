import { type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface WeldingCardProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function WeldingCard({ className, style, children }: WeldingCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} style={style}>
      {children}
    </div>
  )
}
