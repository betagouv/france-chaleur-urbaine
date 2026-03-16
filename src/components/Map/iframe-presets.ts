import type { IframeMapPageProps } from '@/components/Map/IframeMapPage';

type IframePreset = Pick<IframeMapPageProps, 'defaultEnabledLegendFeatures' | 'defaultMapConfiguration' | 'legendLogoOpt'>;

const defaultEnabledLegendFeatures: NonNullable<IframePreset['defaultEnabledLegendFeatures']> = [
  'reseauxDeChaleur',
  'reseauxDeFroid',
  'reseauxEnConstruction',
  'zonesDeDeveloppementPrioritaire',
];

export const iframePresets = {
  dalkia: {
    defaultEnabledLegendFeatures,
    defaultMapConfiguration: {
      filtreGestionnaire: ['dalkia'],
      reseauxDeChaleur: {
        show: true,
      },
    },
    legendLogoOpt: {
      alt: 'logo Dalkia',
      src: '/logo-DALKIA.png',
    },
  },
  engie: {
    defaultEnabledLegendFeatures,
    defaultMapConfiguration: {
      filtreGestionnaire: ['engie'],
      reseauxDeChaleur: {
        show: true,
      },
    },
    legendLogoOpt: {
      alt: 'logo ENGIE',
      src: '/logo-ENGIE.jpg',
    },
  },
  idex: {
    defaultEnabledLegendFeatures,
    defaultMapConfiguration: {
      filtreGestionnaire: ['idex', 'mixéner'],
      reseauxDeChaleur: {
        show: true,
      },
    },
    legendLogoOpt: {
      alt: 'logo Idex',
      src: '/logo-IDEX.jpg',
    },
  },
  viaseva: {
    defaultEnabledLegendFeatures,
    defaultMapConfiguration: {
      reseauxDeChaleur: {
        show: true,
      },
    },
    legendLogoOpt: {
      alt: 'logo viaseva',
      src: '/logo-viaseva.svg',
    },
  },
} as const satisfies Record<string, IframePreset>;

export type IframePresetKey = keyof typeof iframePresets;

export const getIframePreset = (presetKey: string | undefined): IframePreset | undefined => {
  if (!presetKey) {
    return undefined;
  }

  return iframePresets[presetKey.toLowerCase() as IframePresetKey];
};
