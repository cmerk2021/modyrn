import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeaturePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Bullet points describing what this surface will offer. */
  capabilities: string[];
  complexity?: 'Simple' | 'Advanced' | 'Expert';
}

/**
 * A polished placeholder for feature surfaces that are scaffolded but not yet
 * implemented. Communicates intent clearly rather than showing a blank page.
 */
export function FeaturePlaceholder({
  icon: Icon,
  title,
  description,
  capabilities,
  complexity = 'Simple',
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="secondary">{complexity}</Badge>
      </div>

      <Card className="p-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">Planned capabilities</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {capabilities.map((capability) => (
            <li key={capability} className="flex items-center gap-2 text-sm">
              <span className="size-1.5 rounded-full bg-primary" />
              {capability}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
