import { z } from 'zod';

export const zAddRelanceCommentInput = z.object({
  comment: z.string().min(1, 'Le commentaire est requis'),
  relanceId: z.string(),
});
