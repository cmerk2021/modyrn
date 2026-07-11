'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  user: { username: string; globalName?: string | null; avatar?: string | null; id: string };
}

/** Avatar + logout control. Kept intentionally lightweight for the shell. */
export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const name = user.globalName || user.username;
  const initials = name.slice(0, 2).toUpperCase();
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="border-border bg-card flex items-center gap-2 rounded-full border py-1 pl-1 pr-3">
        <span
          className={cn(
            'bg-primary/15 text-primary flex size-7 items-center justify-center overflow-hidden rounded-full text-xs font-semibold',
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="size-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden text-sm font-medium sm:block">{name}</span>
      </div>
      <button
        type="button"
        onClick={() => void logout()}
        aria-label="Log out"
        className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-md transition-colors"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
