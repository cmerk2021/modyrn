import { Search } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface TopbarProps {
  title: string;
  user: { username: string; globalName?: string | null; avatar?: string | null; id: string };
}

/** The dashboard top bar: page title, quick search and user controls. */
export function Topbar({ title, user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <h1 className="text-base font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          <Search className="size-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-border bg-muted px-1.5 text-[0.65rem]">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
