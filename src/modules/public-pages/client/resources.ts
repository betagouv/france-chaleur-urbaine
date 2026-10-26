import { isValidElement, type ReactNode } from 'react';

import { issues, otherHeatingSystem, understandings } from '@/components/Ressources/config';

type PublicPageResource = {
  description: string;
  image?: string;
  slug: string;
  title: string;
};

const getTextFromNode = (node: ReactNode): string =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map((child) => getTextFromNode(child)).join('')
      : isValidElement<{ children?: ReactNode }>(node)
        ? getTextFromNode(node.props.children)
        : '';

/** Articles promoted in the "Tout comprendre avant de se lancer" carousel, in display order. */
export const publicPageResources: PublicPageResource[] = [
  {
    slug: 'reseau-de-chaleur-quels-avantages-par-rapport-a-un-chauffage-collectif-au-gaz-ou-au-fioul',
    ...understandings['reseau-de-chaleur-quels-avantages-par-rapport-a-un-chauffage-collectif-au-gaz-ou-au-fioul'],
  },
  {
    slug: 'comprendre-la-facture-de-chauffage-d-une-copropriete-raccordee-a-un-reseau-de-chaleur',
    ...understandings['comprendre-la-facture-de-chauffage-d-une-copropriete-raccordee-a-un-reseau-de-chaleur'],
  },
  { slug: 'reseau', ...issues.reseau },
  ...Object.entries(otherHeatingSystem).map(([slug, article]) => ({ ...article, slug })),
].map((resource) => ({
  description: getTextFromNode(resource.description),
  image: resource.image,
  slug: resource.slug,
  title: resource.title,
}));
