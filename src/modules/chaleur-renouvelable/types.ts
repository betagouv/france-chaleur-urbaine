import type { Acquisition } from '@/modules/analytics/constants';
import type { RouterInput, RouterOutput } from '@/modules/trpc/client';

export type CcrtDemand = RouterOutput['batEnr']['ccrt']['listDemandesChaleurRenouvelable']['items'][number] & {
  acquisition?: Acquisition | null;
};
export type CcrtDemandUpdate = RouterInput['batEnr']['ccrt']['updateDemandeChaleurRenouvelable']['values'];

export type CcrtFollowUp = RouterOutput['batEnr']['ccrt']['getFollowUp'];
