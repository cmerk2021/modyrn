'use client';

import { useParams } from 'next/navigation';
import { FileText } from 'lucide-react';
import { LOG_EVENT_CATEGORY, type LogEventType } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

interface LogSetting {
  eventType: LogEventType;
  enabled: boolean;
  channelId: string | null;
}
interface Channel {
  id: string;
  name: string;
  type: number;
}
interface LoggingData {
  settings: LogSetting[];
  channels: Channel[];
}

export default function LoggingPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data, loading, refetch } = useApiData<LoggingData>(`/guilds/${guildId}/logging`);

  const update = async (eventType: string, body: Partial<LogSetting>) => {
    await apiFetch(`/guilds/${guildId}/logging/${eventType}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    refetch();
  };

  const textChannels = data?.channels.filter((c) => c.type === 0) ?? [];

  const grouped = new Map<string, LogSetting[]>();
  for (const s of data?.settings ?? []) {
    const cat = LOG_EVENT_CATEGORY[s.eventType];
    grouped.set(cat, [...(grouped.get(cat) ?? []), s]);
  }

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Logging"
        description="Enable each event and route it to a channel."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([category, settings]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {settings.map((s) => (
                  <div key={s.eventType} className="flex items-center gap-3">
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={(enabled) => void update(s.eventType, { enabled })}
                    />
                    <span className="flex-1 text-sm">{s.eventType.replace(/_/g, ' ')}</span>
                    <Select
                      className="max-w-[14rem]"
                      value={s.channelId ?? ''}
                      onChange={(e) =>
                        void update(s.eventType, { channelId: e.target.value || null })
                      }
                    >
                      <option value="">No channel</option>
                      {textChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
