'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { meetsComplexity, type ComplexityMode } from '@modyrn/shared';
import { cn } from '@/lib/utils';
import { brandIcon as BrandIcon, navSections } from './nav';

interface SidebarProps {
  guildId: string;
  guildName: string;
  complexityMode: ComplexityMode;
}

/**
 * The primary dashboard navigation. Items are filtered by the active complexity
 * mode so simpler servers see a focused set while expert servers unlock everything.
 */
export function Sidebar({ guildId, guildName, complexityMode }: SidebarProps) {
  const pathname = usePathname();

  const resolve = (href: string) => href.replace(':guildId', guildId);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <BrandIcon className="size-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Modyrn</span>
          <span className="max-w-[10rem] truncate text-xs text-muted-foreground">{guildName}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navSections.map((section) => {
          const items = section.items.filter((item) =>
            meetsComplexity(complexityMode, item.minComplexity),
          );
          if (items.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="px-3 pb-2 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const href = resolve(item.href);
                  const active =
                    pathname === href ||
                    (href !== `/g/${guildId}` && pathname.startsWith(href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={href}
                        className={cn(
                          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/12 text-primary'
                            : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <Icon
                          className={cn(
                            'size-4 shrink-0 transition-colors',
                            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <span className="block px-3 text-xs capitalize text-muted-foreground">
          {complexityMode} mode
        </span>
      </div>
    </aside>
  );
}
