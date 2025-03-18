import { z } from 'zod';

export const zRenameProEligibilityTestRequest = z.strictObject({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(200, 'Le nom ne peut pas contenir plus de 200 caractères'),
});
export type RenameProEligibilityTestRequest = z.infer<typeof zRenameProEligibilityTestRequest>;
