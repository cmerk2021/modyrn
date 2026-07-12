'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { AutomodRule } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { formatRelativeTime } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RuleEditor } from './rule-editor';

interface Preset {
  key: string;
  label: string;
  description: string;
}
interface AutomodEvent {
  id: string;
  ruleId: string | null;
  userId: string;
  contentSnapshot: string | null;
  createdAt: string;
}

export default function AutomodPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const rules = useApiData<AutomodRule[]>(`/guilds/${guildId}/automod`);
  const presets = useApiData<Preset[]>(`/guilds/${guildId}/automod/presets`);
  const events = useApiData<AutomodEvent[]>(`/guilds/${guildId}/automod/events`);
  const [editing, setEditing] = useState<AutomodRule | 'new' | null>(null);
  const [busy, setBusy] = useState(false);

  const applyPreset = async (key: string) => {
    setBusy(true);
    try {
      await apiFetch(`/guilds/${guildId}/automod/presets/${key}`, { method: 'POST' });
      rules.refetch();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (rule: AutomodRule) => {
    await apiFetch(`/guilds/${guildId}/automod/${rule.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    rules.refetch();
  };

  const remove = async (rule: AutomodRule) => {
    await apiFetch(`/guilds/${guildId}/automod/${rule.id}`, { method: 'DELETE' });
    rules.refetch();
  };

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="Automod"
        description="Presets for a quick start, plus a rule builder for full control."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> New rule
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rules.loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : !rules.data || rules.data.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No rules yet. Apply a preset or create one.
                </p>
              ) : (
                rules.data.map((rule) => (
                  <div
                    key={rule.id}
                    className="border-border flex items-center gap-3 rounded-md border p-3"
                  >
                    <Switch checked={rule.enabled} onCheckedChange={() => void toggle(rule)} />
                    <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(rule)}>
                      <p className="truncate text-sm font-medium">{rule.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {rule.event} · {rule.actions.length} action(s)
                      </p>
                    </button>
                    <Badge variant="secondary">P{rule.priority}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => void remove(rule)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent automod events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!events.data || events.data.length === 0 ? (
                <p className="text-muted-foreground text-sm">No automod activity yet.</p>
              ) : (
                events.data.slice(0, 10).map((e) => (
                  <div key={e.id} className="border-border rounded-md border p-3 text-sm">
                    <span className="font-mono text-xs">{e.userId}</span> —{' '}
                    {e.contentSnapshot || '—'}
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(e.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {presets.data?.map((preset) => (
              <div key={preset.key} className="border-border rounded-md border p-3">
                <p className="text-sm font-medium">{preset.label}</p>
                <p className="text-muted-foreground mb-2 text-xs">{preset.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void applyPreset(preset.key)}
                >
                  Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <RuleEditor
          guildId={guildId}
          rule={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            rules.refetch();
          }}
        />
      )}
    </div>
  );
}
