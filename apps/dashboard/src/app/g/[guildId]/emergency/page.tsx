'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, Lock, Megaphone, Snowflake } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface EmergencyState {
  raidModeEnabled: boolean;
  chatFrozen: boolean;
  invitesRestricted: boolean;
}
interface Channel {
  id: string;
  name: string;
  type: number;
}
interface EmergencyData {
  state: EmergencyState;
  channels: Channel[];
}

export default function EmergencyPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data, loading, refetch } = useApiData<EmergencyData>(`/guilds/${guildId}/emergency`);
  const [channelId, setChannelId] = useState('');
  const [slowmode, setSlowmode] = useState(5);
  const [announcement, setAnnouncement] = useState('');
  const [massUsers, setMassUsers] = useState('');
  const [massAction, setMassAction] = useState<'ban' | 'kick' | 'quarantine'>('ban');
  const [feedback, setFeedback] = useState<string | null>(null);

  const post = async (path: string, body: Record<string, unknown>, msg?: string) => {
    await apiFetch(`/guilds/${guildId}/emergency/${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (msg) setFeedback(msg);
    refetch();
  };

  const textChannels = data?.channels.filter((c) => c.type === 0) ?? [];

  return (
    <div>
      <PageHeader
        icon={AlertTriangle}
        title="Emergency Center"
        description="One-click, high-impact safety actions."
      />

      {loading || !data ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Server posture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Toggle
                icon={<AlertTriangle className="size-4" />}
                label="Raid mode"
                checked={data.state.raidModeEnabled}
                onChange={(v) => void post('raid-mode', { enabled: v })}
              />
              <Toggle
                icon={<Snowflake className="size-4" />}
                label="Freeze all chat (lockdown)"
                checked={data.state.chatFrozen}
                onChange={(v) => void post('freeze', { enabled: v })}
              />
              <Toggle
                icon={<Lock className="size-4" />}
                label="Restrict invites"
                checked={data.state.invitesRestricted}
                onChange={(v) => void post('invites', { enabled: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Channel</Label>
                <Select
                  className="mt-1"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                >
                  <option value="">Select channel…</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Slowmode (seconds)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={slowmode}
                    onChange={(e) => setSlowmode(Number(e.target.value))}
                  />
                </div>
                <Button
                  variant="secondary"
                  disabled={!channelId}
                  onClick={() =>
                    void post('slowmode', { channelId, seconds: slowmode }, 'Slowmode set.')
                  }
                >
                  Apply
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!channelId}
                  onClick={() => void post('lock', { channelId, locked: true }, 'Channel locked.')}
                >
                  Lock
                </Button>
                <Button
                  variant="outline"
                  disabled={!channelId}
                  onClick={() =>
                    void post('lock', { channelId, locked: false }, 'Channel unlocked.')
                  }
                >
                  Unlock
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Message to broadcast…"
              />
              <Button
                disabled={!channelId || !announcement}
                onClick={() =>
                  void post('announce', { channelId, message: announcement }, 'Announcement sent.')
                }
              >
                <Megaphone className="size-4" /> Send to selected channel
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mass action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={massAction} onChange={(e) => setMassAction(e.target.value as 'ban')}>
                <option value="ban">Ban</option>
                <option value="kick">Kick</option>
                <option value="quarantine">Quarantine</option>
              </Select>
              <Textarea
                value={massUsers}
                onChange={(e) => setMassUsers(e.target.value)}
                placeholder="User IDs, one per line"
              />
              <Button
                variant="destructive"
                disabled={!massUsers.trim()}
                onClick={() =>
                  void post(
                    'mass-action',
                    {
                      action: massAction,
                      targetUserIds: massUsers
                        .split(/\s+/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                    'Mass action queued.',
                  )
                }
              >
                Execute
              </Button>
            </CardContent>
          </Card>

          {feedback && (
            <p className="text-sm text-[var(--color-success)] lg:col-span-2">{feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
