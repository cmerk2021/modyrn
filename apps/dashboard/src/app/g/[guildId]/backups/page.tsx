'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DatabaseBackup, Download, Upload } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { formatRelativeTime } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BackupRow {
  id: string;
  status: string;
  sizeBytes: number | null;
  createdAt: string;
}

export default function BackupsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data, refetch } = useApiData<BackupRow[]>(`/guilds/${guildId}/backups`);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const backup = await apiFetch(`/guilds/${guildId}/backups/export`, { method: 'POST' });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `modyrn-backup-${guildId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('Backup exported.');
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file: File) => {
    setBusy(true);
    try {
      const backup = JSON.parse(await file.text());
      const result = await apiFetch<{ restored: string[] }>(`/guilds/${guildId}/backups/restore`, {
        method: 'POST',
        body: JSON.stringify({ backup }),
      });
      setFeedback(`Restored: ${result.restored.join(', ') || 'nothing'}.`);
    } catch {
      setFeedback('Restore failed — invalid backup file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={DatabaseBackup}
        title="Backups"
        description="Export and restore your Modyrn configuration."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-2 pt-6">
          <Button disabled={busy} onClick={() => void exportBackup()}>
            <Download className="size-4" /> Export config
          </Button>
          <Button asChild variant="outline" disabled={busy}>
            <label className="cursor-pointer">
              <Upload className="size-4" /> Restore from file
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void restore(file);
                }}
              />
            </label>
          </Button>
        </CardContent>
      </Card>

      {feedback && <p className="mb-4 text-sm text-[var(--color-success)]">{feedback}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!data || data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No backups yet.</p>
          ) : (
            data.map((b) => (
              <div
                key={b.id}
                className="border-border flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>{formatRelativeTime(b.createdAt)}</span>
                <span className="text-muted-foreground text-xs">
                  {b.status} · {b.sizeBytes ? `${Math.round(b.sizeBytes / 1024)} KB` : '—'}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
