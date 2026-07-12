import { redirect } from 'next/navigation';
import { ComplexityMode } from '@modyrn/shared';
import { getSession } from '@/lib/session';
import { getGuildAccess, getGuildRecord } from '@/lib/guilds';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

/**
 * Layout for all guild-scoped dashboard pages. Enforces authentication, ensures
 * the bot is actually in the guild (otherwise routes to the invite flow), and
 * renders the shell (sidebar + topbar).
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

  // The bot must be present to do anything. If it isn't, send the admin through
  // the invite flow first.
  const access = await getGuildAccess(guildId);
  if (!access?.botPresent) redirect(`/setup/${guildId}`);

  const guild = await getGuildRecord(guildId);

  // Fall back to the Discord-provided name and the most permissive mode when the
  // bot hasn't synced the guild record yet.
  const guildName = guild?.name ?? membership.name;
  const complexityMode = (guild?.complexityMode as ComplexityMode) ?? ComplexityMode.Simple;

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
