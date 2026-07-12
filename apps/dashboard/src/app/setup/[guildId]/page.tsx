import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { getGuildAccess } from '@/lib/guilds';
import { InviteFlow } from './invite-flow';

export const metadata: Metadata = {
  title: 'Add the bot',
};

/**
 * Invite interstitial. Shown when an admin selects a server the Modyrn bot is
 * not yet in. Deliberately lives outside the guild layout so it doesn't trigger
 * the layout's "bot missing" redirect (which would loop).
 */
export default async function SetupPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const membership = session.guilds.find((g) => g.id === guildId);
  if (!membership) redirect('/select-server');

  const access = await getGuildAccess(guildId);
  // Already added — go straight to the dashboard.
  if (access?.botPresent) redirect(`/g/${guildId}`);

  return (
    <InviteFlow
      guildId={guildId}
      guildName={membership.name}
      inviteUrl={access?.inviteUrl ?? '#'}
    />
  );
}
