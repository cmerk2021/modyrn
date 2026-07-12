'use client';

import { useParams } from 'next/navigation';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ACTION_METADATA, type ModerationActionType } from '@modyrn/shared';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Report {
  rangeDays: number;
  totals: { cases: number; automodEvents: number };
  casesByDay: { day: string; count: number }[];
  automodByDay: { day: string; count: number }[];
  actionBreakdown: { action: string; count: number }[];
  topModerators: { moderatorId: string; count: number }[];
}

const tooltipStyle = {
  background: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
} as const;

export default function AnalyticsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data, loading } = useApiData<Report>(`/guilds/${guildId}/analytics?days=14`);

  if (loading || !data) {
    return (
      <div>
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="Activity over the last 14 days."
        />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const breakdown = data.actionBreakdown.map((b) => ({
    label: ACTION_METADATA[b.action as ModerationActionType]?.label ?? b.action,
    count: b.count,
  }));

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Activity over the last 14 days."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Stat label="Cases (14d)" value={data.totals.cases} />
        <Stat label="Automod events (14d)" value={data.totals.automodEvents} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases per day</CardTitle>
            <CardDescription>Moderation cases created</CardDescription>
          </CardHeader>
          <div className="h-56 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.casesByDay}
                margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  dataKey="count"
                  stroke="var(--color-primary)"
                  fill="url(#c)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action breakdown</CardTitle>
            <CardDescription>By moderation type</CardDescription>
          </CardHeader>
          <div className="h-56 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}
