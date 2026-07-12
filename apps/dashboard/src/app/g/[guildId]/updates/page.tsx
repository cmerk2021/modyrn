'use client';

import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface UpdateStatus {
  current: string;
  latest: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  publishedAt: string | null;
  notes: string | null;
}

export default function UpdatesPage() {
  const { data, loading } = useApiData<UpdateStatus>(`/updates`);

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={RefreshCw}
        title="Updates"
        description="Keep your Modyrn instance current."
      />

      {loading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Version</CardTitle>
            {data.updateAvailable ? (
              <Badge variant="warning">Update available</Badge>
            ) : (
              <Badge variant="success">
                <CheckCircle2 className="size-3" /> Up to date
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Current</p>
                <p className="font-mono font-medium">{data.current}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Latest</p>
                <p className="font-mono font-medium">{data.latest ?? 'unknown'}</p>
              </div>
            </div>

            {data.updateAvailable && (
              <div className="border-border rounded-md border p-3">
                <p className="text-sm">
                  Update with <code className="bg-muted rounded px-1">docker compose pull</code>{' '}
                  then <code className="bg-muted rounded px-1">docker compose up -d</code>.
                </p>
                {data.releaseUrl && (
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <a href={data.releaseUrl} target="_blank" rel="noreferrer">
                      View release notes
                    </a>
                  </Button>
                )}
              </div>
            )}

            {data.notes && (
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer">Release notes</summary>
                <pre className="bg-muted mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md p-3 text-xs">
                  {data.notes}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
