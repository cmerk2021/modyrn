'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Gauge, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PermCatalog {
  key: string;
  label: string;
  description: string;
  category: string;
}
interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}
interface Overview {
  catalog: PermCatalog[];
  roles: Role[];
}

export default function PermissionsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { data, loading, refetch } = useApiData<Overview>(`/guilds/${guildId}/permissions`);
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const role = data?.roles.find((r) => r.id === selected) ?? data?.roles[0] ?? null;

  const createRole = async () => {
    if (!newName.trim()) return;
    await apiFetch(`/guilds/${guildId}/permissions/roles`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });
    setNewName('');
    refetch();
  };

  const togglePerm = async (key: string) => {
    if (!role) return;
    const has = role.permissions.includes(key);
    const permissions = has
      ? role.permissions.filter((p) => p !== key)
      : [...role.permissions, key];
    await apiFetch(`/guilds/${guildId}/permissions/roles/${role.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
    refetch();
  };

  const deleteRole = async (roleId: string) => {
    await apiFetch(`/guilds/${guildId}/permissions/roles/${roleId}`, { method: 'DELETE' });
    setSelected(null);
    refetch();
  };

  return (
    <div>
      <PageHeader
        icon={Gauge}
        title="Permissions"
        description="Dashboard roles, separate from Discord permissions."
      />

      {loading || !data ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.roles.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 rounded-md border p-2 ${
                    role?.id === r.id ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <button className="flex-1 text-left text-sm" onClick={() => setSelected(r.id)}>
                    <span
                      className="mr-2 inline-block size-2.5 rounded-full"
                      style={{ background: r.color }}
                    />
                    {r.name}
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => void deleteRole(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="New role name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Button size="icon" onClick={() => void createRole()}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {role ? `Permissions · ${role.name}` : 'Select a role'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {role &&
                data.catalog.map((perm) => (
                  <label
                    key={perm.key}
                    className="border-border flex cursor-pointer items-start gap-3 rounded-md border p-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[var(--color-primary)]"
                      checked={role.permissions.includes(perm.key)}
                      onChange={() => void togglePerm(perm.key)}
                    />
                    <div>
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-muted-foreground text-xs">{perm.description}</p>
                    </div>
                  </label>
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
