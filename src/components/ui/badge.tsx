import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-800',
        available: 'bg-emerald-100 text-emerald-800',
        occupied: 'bg-red-100 text-red-800',
        reserved: 'bg-amber-100 text-amber-800',
        maintenance: 'bg-slate-100 text-slate-600',
        ev: 'bg-cyan-100 text-cyan-800',
        disabled: 'bg-purple-100 text-purple-800',
        family: 'bg-pink-100 text-pink-800',
        paid: 'bg-emerald-100 text-emerald-800',
        pending: 'bg-amber-100 text-amber-800',
        failed: 'bg-red-100 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
