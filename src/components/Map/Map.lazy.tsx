import dynamic from 'next/dynamic';

// =====================================
// Lazy-loaded Map Component
// =====================================

export const Map = dynamic(() => import('./Map').then((mod) => mod.default), {
  ssr: false,
});

export const FullyFeaturedMap = dynamic(() => import('./Map').then((mod) => mod.FullyFeaturedMap), {
  ssr: false,
});

export type { AdresseEligible } from './Map';
