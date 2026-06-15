/**
 * Couches sélectionnables par le formulaire d'intégration d'iframe carte legacy
 * (`IFrameMapIntegrationForm`). Les clés correspondent à l'alias legacy
 * `displayLegend` consommé par la page `/iframe/map`.
 */
export const selectableLayers = [
  {
    key: 'reseau_chaleur',
    label: 'Les réseaux de chaleur existants',
  },
  {
    key: 'futur_reseau',
    label: 'Les réseaux de chaleur en construction',
  },
  {
    key: 'pdp',
    label: 'Les périmètres de développement prioritaire',
  },
  {
    key: 'reseau_froid',
    label: 'Les réseaux de froid',
  },
] as const;

export type LegendURLKey = (typeof selectableLayers)[number]['key'];
