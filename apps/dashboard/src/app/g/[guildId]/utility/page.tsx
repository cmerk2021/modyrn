'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface UtilityConfig {
  module: string;
  enabled: boolean;
  config: Record<string, unknown>;
}
interface UtilityData {
  configs: UtilityConfig[];
  channels: { id: string; name: string; type: number }[];
  roles: { id: string; name: string }[];
}

export default function UtilityPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data, loading, refetch } = useApiData<UtilityData>(`/guilds/${guildId}/utility`);

  const welcome = data?.configs.find((c) => c.module === 'welcome_messages');
  const autorole = data?.configs.find((c) => c.module === 'auto_roles');

  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeChannel, setWelcomeChannel] = useState('');
  const [welcomeContent, setWelcomeContent] = useState('Welcome {user}!');
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoRole, setAutoRole] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (welcome) {
      setWelcomeEnabled(welcome.enabled);
      setWelcomeChannel((welcome.config.channelId as string) ?? '');
      setWelcomeContent((welcome.config.content as string) ?? 'Welcome {user}!');
    }
    if (autorole) {
      setAutoEnabled(autorole.enabled);
      setAutoRole(((autorole.config.roleIds as string[]) ?? [])[0] ?? '');
    }
  }, [welcome, autorole]);

  const save = async (
    module: string,
    body: { enabled: boolean; config: Record<string, unknown> },
  ) => {
    await apiFetch(`/guilds/${guildId}/utility/config/${module}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setFeedback('Saved.');
    refetch();
  };

  const textChannels = data?.channels.filter((c) => c.type === 0) ?? [];

  return (
    <div className="max-w-3xl">
      <PageHeader icon={Wrench} title="Utility" description="Quality-of-life modules." />

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Welcome messages</CardTitle>
              <Switch checked={welcomeEnabled} onCheckedChange={setWelcomeEnabled} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Channel</Label>
                <Select
                  className="mt-1"
                  value={welcomeChannel}
                  onChange={(e) => setWelcomeChannel(e.target.value)}
                >
                  <option value="">Select channel…</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Message ({'{user}'} mentions the member)</Label>
                <Input
                  className="mt-1"
                  value={welcomeContent}
                  onChange={(e) => setWelcomeContent(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  void save('welcome_messages', {
                    enabled: welcomeEnabled,
                    config: { channelId: welcomeChannel, content: welcomeContent },
                  })
                }
              >
                Save
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Auto-role</CardTitle>
              <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Role to assign on join</Label>
                <Select
                  className="mt-1"
                  value={autoRole}
                  onChange={(e) => setAutoRole(e.target.value)}
                >
                  <option value="">Select role…</option>
                  {data?.roles
                    .filter((r) => r.name !== '@everyone')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </Select>
              </div>
              <Button
                onClick={() =>
                  void save('auto_roles', {
                    enabled: autoEnabled,
                    config: { roleIds: autoRole ? [autoRole] : [] },
                  })
                }
              >
                Save
              </Button>
            </CardContent>
          </Card>

          {feedback && <p className="text-sm text-[var(--color-success)]">{feedback}</p>}
        </div>
      )}
    </div>
  );
}
