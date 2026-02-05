import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export default function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        {
          'h-4 w-full': variant === 'text',
          'h-10 w-10 rounded-full': variant === 'circular',
          'h-32 w-full': variant === 'rectangular',
        },
        className
      )}
    />
  )
}
