import { z } from 'zod';

export const zAcquisition = z.object({
  campaign: z.string().trim().max(200).nullable(),
  keyword: z.string().trim().max(200).optional(),
  medium: z.string().trim().max(200).nullable(),
  source: z.string().trim().max(200).nullable(),
});
export type Acquisition = z.infer<typeof zAcquisition>;

export const getAcquisitionSource = (acquisition: Acquisition) =>
  acquisition.source?.toLowerCase() === 'google' && /^(cpc|ppc|paidsearch|paid_search)$/i.test(acquisition.medium ?? '')
    ? 'Google Ads'
    : acquisition.source;
