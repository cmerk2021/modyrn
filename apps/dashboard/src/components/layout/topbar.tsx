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
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-6 backdrop-blur">
      <h1 className="text-base font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="border-border bg-card text-muted-foreground hover:text-foreground hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors sm:flex"
        >
          <Search className="size-4" />
          <span>Search</span>
          <kbd className="border-border bg-muted ml-2 rounded border px-1.5 text-[0.65rem]">⌘K</kbd>
        </button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
