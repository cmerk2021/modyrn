'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface InviteFlowProps {
  guildId: string;
  guildName: string;
  inviteUrl: string;
}

/**
 * Guides the admin through authorizing the bot into a specific server, then
 * polls for the bot's arrival and continues into the dashboard automatically.
 */
export function InviteFlow({ guildId, guildName, inviteUrl }: InviteFlowProps) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [checking, setChecking] = useState(false);
  const [present, setPresent] = useState(false);

  // Once the admin has opened the Discord authorization page, poll for the bot.
  useEffect(() => {
    if (!opened || present) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const access = await apiFetch<{ botPresent: boolean }>(`/guilds/${guildId}/access`);
        if (!cancelled && access.botPresent) {
          setPresent(true);
          clearInterval(interval);
          router.replace(`/g/${guildId}`);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [opened, present, guildId, router]);

  const checkNow = async () => {
    setChecking(true);
    try {
      const access = await apiFetch<{ botPresent: boolean }>(`/guilds/${guildId}/access`);
      if (access.botPresent) {
        setPresent(true);
        router.replace(`/g/${guildId}`);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background:radial-gradient(50%_40%_at_50%_20%,color-mix(in_oklch,var(--color-primary)_18%,transparent),transparent)]"
      />
      <div className="border-border bg-card w-full max-w-md rounded-2xl border p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="bg-primary/15 text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
            <Bot className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Add Modyrn to {guildName}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Modyrn needs to join this server before it can moderate. Authorize the bot, then come
            back here.
          </p>
        </div>

        <ol className="mb-6 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              1
            </span>
            Open the Discord authorization page and add the bot to <strong>{guildName}</strong>.
          </li>
          <li className="flex gap-3">
            <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              2
            </span>
            Return here — we&apos;ll detect it automatically.
          </li>
        </ol>

        <div className="space-y-2">
          <Button asChild size="lg" className="w-full" onClick={() => setOpened(true)}>
            <a href={inviteUrl} target="_blank" rel="noreferrer">
              Authorize on Discord <ExternalLink className="size-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => void checkNow()}
            disabled={checking || present}
          >
            {present ? (
              <>
                <CheckCircle2 className="size-4" /> Bot added — continuing
              </>
            ) : checking ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Checking…
              </>
            ) : (
              <>
                I&apos;ve added it — continue <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>

        {opened && !present && (
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Waiting for the bot to join {guildName}…
          </p>
        )}
      </div>
    </main>
  );
}
