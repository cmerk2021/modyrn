import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ComplexityMode } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

interface GuildRecord {
  id: string;
  name: string;
  complexityMode: ComplexityMode;
}

async function getGuild(guildId: string, cookieHeader: string): Promise<GuildRecord | null> {
  try {
    return await apiFetch<GuildRecord>(`/guilds/${guildId}`, {
      cookie: cookieHeader,
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

/**
 * Layout for all guild-scoped dashboard pages. Enforces authentication, resolves
 * the guild and its complexity mode, and renders the shell (sidebar + topbar).
 */
export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const membership = session.guilds.find((g) => g.id === guildId);
  if (!membership) redirect('/select-server');

  const cookieHeader = (await cookies()).toString();
  const guild = await getGuild(guildId, cookieHeader);

  // Fall back to the Discord-provided name and the most permissive mode when the
  // bot hasn't synced the guild record yet.
  const guildName = guild?.name ?? membership.name;
  const complexityMode = guild?.complexityMode ?? ComplexityMode.Simple;

  return (
    <div className="flex min-h-screen">
      <Sidebar guildId={guildId} guildName={guildName} complexityMode={complexityMode} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title="Dashboard" user={session.user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
