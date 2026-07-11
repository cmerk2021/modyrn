import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/session';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Select a server',
};

/** Lets the signed-in user pick which of their manageable guilds to open. */
export default async function SelectServerPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a server</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a community to manage with Modyrn.
        </p>
      </div>

      {session.guilds.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-8 text-center">
          <ShieldCheck className="text-muted-foreground mx-auto mb-3 size-6" />
          <p className="text-sm font-medium">No manageable servers found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            You need the Manage Server permission in a Discord server to manage it here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {session.guilds.map((guild) => {
            const icon = guild.icon
              ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
              : null;
            return (
              <li key={guild.id}>
                <Link
                  href={`/g/${guild.id}`}
                  className="border-border bg-card hover:border-primary/40 hover:bg-accent flex items-center gap-3 rounded-xl border p-4 transition-colors"
                >
                  <span className="bg-primary/15 text-primary flex size-10 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold">
                    {icon ? (
                      <img src={icon} alt={guild.name} className="size-full object-cover" />
                    ) : (
                      guild.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{guild.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {guild.owner ? 'Owner' : 'Manager'}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" size="sm">
          <a href="/api/v1/auth/logout" className="text-muted-foreground">
            Sign out
          </a>
        </Button>
      </div>
    </main>
  );
}
