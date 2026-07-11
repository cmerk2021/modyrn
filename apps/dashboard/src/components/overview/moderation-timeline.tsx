import { ACTION_METADATA, type ModerationActionType } from '@modyrn/shared';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

export interface TimelineCase {
  id: string;
  caseNumber: number;
  action: ModerationActionType;
  targetLabel: string;
  moderatorLabel: string;
  createdAt: string;
}

const SEVERITY_VARIANT = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
} as const;

interface ModerationTimelineProps {
  cases: TimelineCase[];
}

/** Recent moderation activity feed on the overview dashboard. */
export function ModerationTimeline({ cases }: ModerationTimelineProps) {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Recent moderation</CardTitle>
      </CardHeader>
      <div className="px-6 pb-6">
        {cases.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No recent actions.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-4">
            {cases.map((item) => {
              const meta = ACTION_METADATA[item.action];
              return (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[1.32rem] top-1 size-2 rounded-full bg-primary" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">
                      <span className="font-medium">{item.moderatorLabel}</span>{' '}
                      <span className="text-muted-foreground">{meta.pastTense}</span>{' '}
                      <span className="font-medium">{item.targetLabel}</span>
                    </span>
                    <Badge variant={SEVERITY_VARIANT[meta.severity]}>#{item.caseNumber}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
