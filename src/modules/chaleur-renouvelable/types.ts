import type { RouterInput, RouterOutput } from '@/modules/trpc/client';

export type CcrtDemand = RouterOutput['batEnr']['ccrt']['listDemandesChaleurRenouvelable']['items'][number];
export type CcrtDemandUpdate = RouterInput['batEnr']['ccrt']['updateDemandeChaleurRenouvelable']['values'];

export type CcrtFollowUp = RouterOutput['batEnr']['ccrt']['getFollowUp'];
export type CcrtNote = CcrtFollowUp['notes'][number];
export type CcrtBuildingUpdate = RouterInput['batEnr']['ccrt']['updateBuilding'];
