import Image from '@/components/ui/Image';
import type { ModeDeChauffageUsage } from '@/modules/chaleur-renouvelable/client/modesChauffageData';

const usageTagConfig = {
  heating: {
    icon: '/img/icon-chauffage.svg',
    label: 'Chauffage',
  },
  hotWater: {
    icon: '/img/icon-eau-chaude.svg',
    label: 'Eau chaude',
  },
} satisfies Record<string, { icon: string; label: string }>;

export function UsageTags({ usage }: { usage: ModeDeChauffageUsage }) {
  const tags = usage === 'heatingAndHotWater' ? [usageTagConfig.heating, usageTagConfig.hotWater] : [usageTagConfig.hotWater];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag.label} className="inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm">
          <Image src={tag.icon} alt={`icone ${usage}`} width={20} height={20} aria-hidden="true" />
          {tag.label}
        </span>
      ))}
    </div>
  );
}
