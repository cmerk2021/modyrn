import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCompact } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value?: number;
  icon: LucideIcon;
  /** Optional percentage delta vs. the previous period. */
  delta?: number;
  /** Optional non-numeric display (e.g. latency in ms). */
  display?: string;
  loading?: boolean;
}

/** A single KPI tile on the overview dashboard. */
export function StatCard({ label, value, icon: Icon, delta, display, loading }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="text-3xl font-semibold tracking-tight">
            {display ?? (value !== undefined ? formatCompact(value) : '—')}
          </span>
        )}
        {delta !== undefined && !loading && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              positive ? 'text-[var(--color-success)]' : 'text-destructive',
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </Card>
  );
}
