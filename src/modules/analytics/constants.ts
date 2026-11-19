import { z } from 'zod';

const zAcquisitionPath = z
  .string()
  .trim()
  .max(1000)
  .regex(/^\/[^?#]*$/)
  .optional();

export const zAcquisition = z.object({
  campaign: z.string().trim().max(200).nullable(),
  creationMethod: z.enum(['admin', 'api', 'batch', 'transfer']).optional(),
  fcuEmail: z.boolean().optional(),
  formPage: zAcquisitionPath,
  host: z
    .string()
    .trim()
    .max(1000)
    .regex(/^[^?#]*$/)
    .optional(),
  inIframe: z.boolean().optional(),
  integrationId: z.string().trim().max(200).optional(),
  keyword: z.string().trim().max(200).optional(),
  landingPage: zAcquisitionPath,
  medium: z.string().trim().max(200).nullable(),
  referrer: z
    .string()
    .trim()
    .max(253)
    .regex(/^[a-z0-9.-]+$/i)
    .optional(),
  source: z.string().trim().max(200).nullable(),
});
export type Acquisition = z.infer<typeof zAcquisition>;
