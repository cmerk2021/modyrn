import { cn } from '@/lib/utils';

/** A shimmering placeholder used while content loads. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />;
}

export { Skeleton };
