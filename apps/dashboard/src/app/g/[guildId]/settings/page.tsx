'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Settings } from 'lucide-react';
import { COMPLEXITY_METADATA, COMPLEXITY_MODES, type ComplexityMode } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface GuildRecord {
  complexityMode: ComplexityMode;
  settings: {
    modLogChannelId?: string;
    quarantineRoleId?: string;
    memberRoleId?: string;
    dmOnAction?: boolean;
  };
}
interface Meta {
  roles: { id: string; name: string }[];
  channels: { id: string; name: string; type: number }[];
}

export default function SettingsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const guild = useApiData<GuildRecord>(`/guilds/${guildId}`);
  const meta = useApiData<Meta>(`/guilds/${guildId}/meta`);

  const [complexity, setComplexity] = useState<ComplexityMode>('simple');
  const [modLog, setModLog] = useState('');
  const [quarantineRole, setQuarantineRole] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [dmOnAction, setDmOnAction] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (guild.data) {
      setComplexity(guild.data.complexityMode);
      setModLog(guild.data.settings.modLogChannelId ?? '');
      setQuarantineRole(guild.data.settings.quarantineRoleId ?? '');
      setMemberRole(guild.data.settings.memberRoleId ?? '');
      setDmOnAction(Boolean(guild.data.settings.dmOnAction));
    }
  }, [guild.data]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch(`/guilds/${guildId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          complexityMode: complexity,
          modLogChannelId: modLog,
          quarantineRoleId: quarantineRole,
          memberRoleId: memberRole,
          dmOnAction,
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const textChannels = meta.data?.channels.filter((c) => c.type === 0) ?? [];

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Guild-wide platform configuration."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Complexity mode</Label>
            <Select
              className="mt-1"
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as ComplexityMode)}
            >
              {COMPLEXITY_MODES.map((m) => (
                <option key={m} value={m}>
                  {COMPLEXITY_METADATA[m].label}
                </option>
              ))}
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              {COMPLEXITY_METADATA[complexity].description}
            </p>
          </div>

          <div>
            <Label>Moderation log channel</Label>
            <Select className="mt-1" value={modLog} onChange={(e) => setModLog(e.target.value)}>
              <option value="">None</option>
              {textChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Quarantine role</Label>
            <Select
              className="mt-1"
              value={quarantineRole}
              onChange={(e) => setQuarantineRole(e.target.value)}
            >
              <option value="">None</option>
              {meta.data?.roles
                .filter((r) => r.name !== '@everyone')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <Label>Member role</Label>
            <Select
              className="mt-1"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
            >
              <option value="">@everyone (default)</option>
              {meta.data?.roles
                .filter((r) => r.name !== '@everyone')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              Used by emergency actions (freeze chat, lock channel) to toggle send permissions. Pick
              the role members use to talk if your server is gated behind one; otherwise leave as
              @everyone.
            </p>
          </div>

          <div className="border-border flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">DM users on action</p>
              <p className="text-muted-foreground text-xs">
                Notify members by DM when they&apos;re warned, timed out, kicked or banned.
              </p>
            </div>
            <Switch checked={dmOnAction} onCheckedChange={setDmOnAction} />
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {saved && <span className="text-sm text-[var(--color-success)]">Saved</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
