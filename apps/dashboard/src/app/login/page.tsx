import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sign in',
};

/**
 * Login screen. Authentication is delegated to the API's Discord OAuth flow;
 * this simply hands off to `/api/v1/auth/discord`.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background:radial-gradient(50%_40%_at_50%_20%,color-mix(in_oklch,var(--color-primary)_20%,transparent),transparent)]"
      />
      <div className="border-border bg-card w-full max-w-sm rounded-2xl border p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="bg-primary/15 text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Welcome to Modyrn</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Sign in with Discord to manage your communities.
          </p>
        </div>

        <Button asChild size="lg" className="w-full">
          <a href="/api/v1/auth/discord">Continue with Discord</a>
        </Button>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          By continuing you agree to the{' '}
          <Link href="https://github.com/modyrn/modyrn" className="underline underline-offset-2">
            terms
          </Link>
          . Modyrn only requests the access it needs.
        </p>
      </div>
    </main>
  );
}
