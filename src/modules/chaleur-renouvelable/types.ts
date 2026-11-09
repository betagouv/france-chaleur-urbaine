import type { RouterInput, RouterOutput } from '@/modules/trpc/client';

export type CcrtDemand = RouterOutput['batEnr']['ccrt']['listDemandesChaleurRenouvelable']['items'][number] &
  Partial<Pick<RouterOutput['batEnr']['admin']['listDemandesChaleurRenouvelable']['items'][number], 'acquisition'>>;
export type CcrtDemandUpdate = RouterInput['batEnr']['ccrt']['updateDemandeChaleurRenouvelable']['values'];

export type CcrtFollowUp = RouterOutput['batEnr']['ccrt']['getFollowUp'];
