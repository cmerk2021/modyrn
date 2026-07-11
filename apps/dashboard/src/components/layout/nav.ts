import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  DatabaseBackup,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ComplexityMode, type DashboardPermission } from '@modyrn/shared';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Minimum complexity mode at which this item is shown. */
  minComplexity: ComplexityMode;
  /** Permission required to see this item, if any. */
  permission?: DashboardPermission;
  /** Optional short description for command palette / tooltips. */
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * The dashboard navigation. Items are progressively revealed based on the
 * guild's complexity mode, reinforcing Modyrn's progressive-complexity principle.
 * `:guildId` is substituted at render time.
 */
export const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/g/:guildId',
        icon: LayoutDashboard,
        minComplexity: ComplexityMode.Simple,
        description: 'At-a-glance server health and activity.',
      },
      {
        label: 'Members',
        href: '/g/:guildId/members',
        icon: Users,
        minComplexity: ComplexityMode.Simple,
        description: 'Search, filter and moderate members.',
      },
    ],
  },
  {
    title: 'Moderation',
    items: [
      {
        label: 'Cases',
        href: '/g/:guildId/cases',
        icon: ListChecks,
        minComplexity: ComplexityMode.Simple,
        description: 'Every moderation action, searchable.',
      },
      {
        label: 'Automod',
        href: '/g/:guildId/automod',
        icon: ShieldCheck,
        minComplexity: ComplexityMode.Simple,
        description: 'Presets and the visual rule builder.',
      },
      {
        label: 'Emergency',
        href: '/g/:guildId/emergency',
        icon: AlertTriangle,
        minComplexity: ComplexityMode.Expert,
        description: 'Raid mode, lockdowns and mass actions.',
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        label: 'Logging',
        href: '/g/:guildId/logging',
        icon: FileText,
        minComplexity: ComplexityMode.Simple,
        description: 'Per-event logging configuration.',
      },
      {
        label: 'Utility',
        href: '/g/:guildId/utility',
        icon: Wrench,
        minComplexity: ComplexityMode.Simple,
        description: 'Reaction roles, welcomes, embeds and more.',
      },
      {
        label: 'Embed Builder',
        href: '/g/:guildId/embeds',
        icon: Sparkles,
        minComplexity: ComplexityMode.Advanced,
        description: 'Design rich embeds with live preview.',
      },
      {
        label: 'Analytics',
        href: '/g/:guildId/analytics',
        icon: BarChart3,
        minComplexity: ComplexityMode.Expert,
        description: 'Growth, activity and moderation trends.',
      },
      {
        label: 'Permissions',
        href: '/g/:guildId/permissions',
        icon: Gauge,
        minComplexity: ComplexityMode.Advanced,
        description: 'Dashboard roles and granular access.',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        href: '/g/:guildId/settings',
        icon: Settings,
        minComplexity: ComplexityMode.Simple,
      },
      {
        label: 'System Health',
        href: '/g/:guildId/health',
        icon: Activity,
        minComplexity: ComplexityMode.Advanced,
      },
      {
        label: 'Backups',
        href: '/g/:guildId/backups',
        icon: DatabaseBackup,
        minComplexity: ComplexityMode.Expert,
      },
      {
        label: 'Updates',
        href: '/g/:guildId/updates',
        icon: RefreshCw,
        minComplexity: ComplexityMode.Expert,
      },
    ],
  },
];

export const brandIcon = Bot;
