import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Users,
    title: 'Member Explorer',
    body: 'Fast search, filtering and bulk actions with rich per-member history.',
  },
  {
    icon: ShieldCheck,
    title: 'Visual Automod',
    body: 'Build IF / AND / THEN rules with nested conditions, priorities and simulation.',
  },
  {
    icon: Zap,
    title: 'Emergency Center',
    body: 'One-click raid mode, chat freeze, lockdowns and mass quarantine.',
  },
  {
    icon: Sparkles,
    title: 'Embed Builder',
    body: 'Design rich embeds with live preview, variables and templates. No JSON.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_22%,transparent),transparent)]"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </div>
          Modyrn
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/modyrn/modyrn"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            GitHub
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="border-border bg-card text-muted-foreground mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
          Self-hosted · Open source
        </span>
        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Dashboard-first moderation for modern Discord communities.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-balance text-lg">
          Modyrn is a self-hosted moderation platform — not a bot. The dashboard is the product; the
          bot is just an agent. Progressive complexity scales from 10 to 500,000+ members.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Open dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="https://github.com/modyrn/modyrn#quick-start-self-hosting">Self-host</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="border-border bg-card rounded-xl border p-5 text-left"
            >
              <div className="bg-primary/12 text-primary mb-3 flex size-9 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </div>
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm">{feature.body}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
