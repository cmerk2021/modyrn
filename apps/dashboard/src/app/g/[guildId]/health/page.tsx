'use client';

import { Activity } from 'lucide-react';
import { HealthStatus, type HealthReport } from '@modyrn/shared';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { StatusPill } from '@/components/overview/status-pill';
import { Skeleton } from '@/components/ui/skeleton';

export default function HealthPage() {
  const { data, loading } = useApiData<HealthReport>(`/health`);

  return (
    <div>
      <PageHeader
        icon={Activity}
        title="System Health"
        description="Live status of every Modyrn component."
      />

      {loading || !data ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <StatusPill
              label="Database"
              status={data.dependencies.database.status}
              detail={`${data.dependencies.database.latencyMs ?? '—'} ms`}
            />
            <StatusPill
              label="Redis"
              status={data.dependencies.redis.status}
              detail={`${data.dependencies.redis.latencyMs ?? '—'} ms`}
            />
            <StatusPill
              label="Discord gateway"
              status={data.dependencies.discordGateway.status}
              detail={`${data.dependencies.discordGateway.latencyMs ?? '—'} ms`}
            />
          </div>
          <Card className="grid gap-4 p-5 sm:grid-cols-3">
            <Info
              label="Overall"
              value={data.status === HealthStatus.Up ? 'Operational' : data.status}
            />
            <Info label="Version" value={data.version} />
            <Info label="Uptime" value={`${Math.floor(data.uptimeSeconds / 60)} min`} />
          </Card>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-0.5 font-medium capitalize">{value}</p>
    </div>
  );
}
