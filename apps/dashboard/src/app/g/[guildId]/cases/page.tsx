'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ListChecks } from 'lucide-react';
import {
  ACTION_METADATA,
  CASE_STATUSES,
  MODERATION_ACTION_TYPES,
  type ModerationActionType,
  type PaginatedResult,
} from '@modyrn/shared';
import { useApiData } from '@/lib/use-api';
import { formatRelativeTime } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseDetailDialog } from './case-detail-dialog';

interface CaseRow {
  id: string;
  caseNumber: number;
  action: ModerationActionType;
  status: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  targetUserId: string;
  moderatorId: string;
  targetName: string;
  moderatorName: string;
  reason: string | null;
  createdAt: string;
}

const SEVERITY: Record<string, 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
};

export default function CasesPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: '25' });
  if (search) params.set('search', search);
  if (action) params.set('action', action);
  if (status) params.set('status', status);

  const { data, loading, refetch } = useApiData<PaginatedResult<CaseRow>>(
    `/guilds/${guildId}/cases?${params.toString()}`,
  );

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        title="Moderation Cases"
        description="Every moderation action, searchable and auditable."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search reason or user ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          className="max-w-[10rem]"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All actions</option>
          {MODERATION_ACTION_TYPES.map((a) => (
            <option key={a} value={a}>
              {ACTION_METADATA[a].label}
            </option>
          ))}
        </Select>
        <Select
          className="max-w-[10rem]"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="divide-border divide-y">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))
        ) : !data || data.items.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">No cases found.</p>
        ) : (
          data.items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className="hover:bg-muted/50 flex w-full items-center gap-3 p-4 text-left text-sm transition-colors"
            >
              <span className="text-muted-foreground w-14 shrink-0 font-mono">#{c.caseNumber}</span>
              <Badge variant={SEVERITY[c.severity]}>{ACTION_METADATA[c.action]?.label}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <span className="font-medium">{c.targetName}</span>
                  {c.reason ? ` — ${c.reason}` : ''}
                </p>
                <p className="text-muted-foreground truncate text-xs">by {c.moderatorName}</p>
              </div>
              <span className="text-muted-foreground hidden text-xs sm:block">
                {formatRelativeTime(c.createdAt)}
              </span>
              <Badge variant="outline">{c.status}</Badge>
            </button>
          ))
        )}
      </Card>

      {data && data.total > data.pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} · {data.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <CaseDetailDialog
          guildId={guildId}
          caseId={selected}
          onClose={() => setSelected(null)}
          onChange={refetch}
        />
      )}
    </div>
  );
}
