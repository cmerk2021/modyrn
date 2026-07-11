import { Sparkles } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default function EmbedsPage() {
  return (
    <FeaturePlaceholder
      icon={Sparkles}
      title="Embed Builder"
      description="Design rich Discord embeds visually — never write JSON by hand."
      complexity="Advanced"
      capabilities={[
        'Live preview as you edit',
        'Titles, colors, authors, images & footers',
        'Buttons and select menus',
        'Variables & placeholders',
        'Multi-embed messages & reusable templates',
        'Schedule sends and edit live messages',
      ]}
    />
  );
}
