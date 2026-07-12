'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Ban, Search, ShieldAlert, UserX, Users } from 'lucide-react';
import { useApiData } from '@/lib/use-api';
import { formatRelativeTime } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberDialog } from './member-dialog';

interface MemberListItem {
  id: string;
  username: string;
  globalName: string | null;
  nickname: string | null;
  avatar: string | null;
  isBot: boolean;
  roleIds: string[];
  joinedAt: string | null;
  accountCreatedAt: string;
}

export default function MembersPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const { data, loading, refetch } = useApiData<MemberListItem[]>(
    `/guilds/${guildId}/members${query ? `?search=${encodeURIComponent(query)}` : ''}`,
  );

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Member Explorer"
        description="Search members and take moderation action."
      />

      <form
        className="mb-4 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search);
        }}
      >
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <Card className="divide-border divide-y">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))
        ) : !data || data.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">No members found.</p>
        ) : (
          data.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelected(member.id)}
              className="hover:bg-accent flex w-full items-center gap-3 p-4 text-left transition-colors"
            >
              <Avatar member={member} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  {member.globalName || member.username}
                  {member.isBot && <Badge variant="secondary">BOT</Badge>}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  @{member.username} · joined{' '}
                  {member.joinedAt ? formatRelativeTime(member.joinedAt) : 'unknown'}
                </p>
              </div>
              <div className="text-muted-foreground hidden gap-1 sm:flex">
                <ShieldAlert className="size-4" />
                <UserX className="size-4" />
                <Ban className="size-4" />
              </div>
            </button>
          ))
        )}
      </Card>

      {selected && (
        <MemberDialog
          guildId={guildId}
          userId={selected}
          onClose={() => setSelected(null)}
          onAction={() => refetch()}
        />
      )}
    </div>
  );
}

function Avatar({ member }: { member: MemberListItem }) {
  const url = member.avatar
    ? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`
    : null;
  return (
    <span className="bg-primary/15 text-primary flex size-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        (member.globalName || member.username).slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
