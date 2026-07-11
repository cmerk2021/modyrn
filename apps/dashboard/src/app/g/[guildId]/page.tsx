'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Activity,
  Ban,
  Gauge,
  MessagesSquare,
  ShieldAlert,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { HealthStatus, type OverviewMetrics } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/overview/stat-card';
import { StatusPill } from '@/components/overview/status-pill';
import { ActivityChart, type ActivityPoint } from '@/components/overview/activity-chart';
import {
  ModerationTimeline,
  type TimelineCase,
} from '@/components/overview/moderation-timeline';

interface OverviewResponse {
  metrics: OverviewMetrics;
  activity: ActivityPoint[];
  recentCases: TimelineCase[];
}

export default function OverviewPage() {
  const params = useParams<{ guildId: string }>();
  const guildId = params.guildId;
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<OverviewResponse>(`/guilds/${guildId}/overview`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            A live pulse of your community and platform health.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ShieldAlert className="size-4" /> Emergency
          </Button>
          <Button size="sm">
            <UserPlus className="size-4" /> Quick action
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Members"
          icon={Users}
          value={metrics?.memberCount}
          loading={loading}
          delta={3.2}
        />
        <StatCard
          label="Online"
          icon={Activity}
          value={metrics?.onlineCount}
          loading={loading}
        />
        <StatCard
          label="Cases today"
          icon={Ban}
          value={metrics?.casesToday}
          loading={loading}
        />
        <StatCard
          label="Automod events"
          icon={ShieldAlert}
          value={metrics?.automodEventsToday}
          loading={loading}
        />
      </div>

      {/* Latency + status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gateway latency"
          icon={Zap}
          display={metrics ? `${metrics.gatewayLatencyMs} ms` : undefined}
          loading={loading}
        />
        <StatCard
          label="API latency"
          icon={Gauge}
          display={metrics ? `${metrics.apiLatencyMs} ms` : undefined}
          loading={loading}
        />
        <StatusPill
          label="Database"
          status={metrics?.databaseStatus ?? HealthStatus.Down}
        />
        <StatusPill label="Redis" status={metrics?.redisStatus ?? HealthStatus.Down} />
      </div>

      {/* Charts + timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActivityChart data={data?.activity ?? []} />
        <ModerationTimeline cases={data?.recentCases ?? []} />
      </div>

      {!loading && !data && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <MessagesSquare className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once the bot syncs your server, live metrics will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
