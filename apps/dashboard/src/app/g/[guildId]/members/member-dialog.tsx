'use client';

import { useState } from 'react';
import { ACTION_METADATA, type ModerationActionType } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { formatRelativeTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Profile {
  id: string;
  username: string;
  globalName: string | null;
  nickname: string | null;
  avatar: string | null;
  roleIds: string[];
  joinedAt: string | null;
  accountCreatedAt: string;
  timedOutUntil: string | null;
  quarantined: boolean;
  caseCount: number;
  cases: {
    id: string;
    caseNumber: number;
    action: ModerationActionType;
    reason: string | null;
    createdAt: string;
  }[];
  notes: { id: string; content: string; authorId: string; createdAt: string }[];
}

interface MemberDialogProps {
  guildId: string;
  userId: string;
  onClose: () => void;
  onAction: () => void;
}

const DURATIONS = [
  { label: '10 minutes', ms: 600_000 },
  { label: '1 hour', ms: 3_600_000 },
  { label: '1 day', ms: 86_400_000 },
  { label: '1 week', ms: 604_800_000 },
];

export function MemberDialog({ guildId, userId, onClose, onAction }: MemberDialogProps) {
  const {
    data: profile,
    loading,
    refetch,
  } = useApiData<Profile>(`/guilds/${guildId}/members/${userId}`);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(DURATIONS[0]!.ms);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (path: string, body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setError(null);
    try {
      await apiFetch(`/guilds/${guildId}/actions/${path}`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: userId, ...body }),
      });
      setReason('');
      refetch();
      onAction();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy('note');
    try {
      await apiFetch(`/guilds/${guildId}/members/${userId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: note }),
      });
      setNote('');
      refetch();
    } finally {
      setBusy(null);
    }
  };

  const name = profile?.globalName || profile?.username || 'Member';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            {profile ? `@${profile.username} · ${profile.caseCount} case(s)` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {loading || !profile ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Loading profile…</p>
        ) : (
          <Tabs defaultValue="actions">
            <TabsList>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="cases">Cases ({profile.cases.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({profile.notes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="actions">
              <div className="space-y-3">
                <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                  <span>
                    Joined: {profile.joinedAt ? formatRelativeTime(profile.joinedAt) : 'unknown'}
                  </span>
                  <span>· Account: {formatRelativeTime(profile.accountCreatedAt)}</span>
                  {profile.quarantined && <Badge variant="destructive">Quarantined</Badge>}
                  {profile.timedOutUntil && <Badge variant="warning">Timed out</Badge>}
                </div>

                <div>
                  <Label>Reason</Label>
                  <Input
                    className="mt-1"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Timeout duration</Label>
                    <Select
                      className="mt-1"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    >
                      {DURATIONS.map((d) => (
                        <option key={d.ms} value={d.ms}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={busy !== null}
                    onClick={() => run('timeout', { durationMs: duration, reason }, 'timeout')}
                  >
                    Timeout
                  </Button>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => run('warn', { reason }, 'warn')}
                  >
                    Warn
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => run('quarantine', { reason }, 'quarantine')}
                  >
                    Quarantine
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => run('kick', { reason }, 'kick')}
                  >
                    Kick
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busy !== null}
                    onClick={() => run('ban', { reason }, 'ban')}
                  >
                    Ban
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => run('unquarantine', { reason }, 'unquarantine')}
                  >
                    Release
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => run('remove-timeout', { reason }, 'remove-timeout')}
                  >
                    Untimeout
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cases">
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {profile.cases.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">No cases.</p>
                ) : (
                  profile.cases.map((c) => (
                    <div
                      key={c.id}
                      className="border-border flex items-center justify-between rounded-md border p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          #{c.caseNumber} · {ACTION_METADATA[c.action]?.label ?? c.action}
                        </span>
                        <p className="text-muted-foreground text-xs">
                          {c.reason || 'No reason'} · {formatRelativeTime(c.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a moderator note…"
                    className="min-h-[40px]"
                  />
                  <Button disabled={busy !== null} onClick={() => void addNote()}>
                    Add
                  </Button>
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {profile.notes.map((n) => (
                    <div key={n.id} className="border-border rounded-md border p-3 text-sm">
                      {n.content}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
