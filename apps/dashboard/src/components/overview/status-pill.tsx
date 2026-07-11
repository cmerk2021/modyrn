import { HealthStatus } from '@modyrn/shared';
import { cn } from '@/lib/utils';

const STATUS_META: Record<HealthStatus, { label: string; className: string }> = {
  [HealthStatus.Up]: { label: 'Operational', className: 'bg-[var(--color-success)]' },
  [HealthStatus.Degraded]: { label: 'Degraded', className: 'bg-[var(--color-warning)]' },
  [HealthStatus.Down]: { label: 'Down', className: 'bg-destructive' },
};

interface StatusPillProps {
  label: string;
  status: HealthStatus;
  detail?: string;
}

/** Compact dependency status indicator for the overview health row. */
export function StatusPill({ label, status, detail }: StatusPillProps) {
  const meta = STATUS_META[status];
  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-lg border px-4 py-3">
      <span className="relative flex size-2.5">
        <span
          className={cn(
            'absolute inline-flex size-full animate-ping rounded-full opacity-60',
            meta.className,
          )}
        />
        <span className={cn('relative inline-flex size-2.5 rounded-full', meta.className)} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground truncate text-xs">{detail ?? meta.label}</p>
      </div>
    </div>
  );
}
