import { route, router } from '@/modules/trpc/server';

import { zAddRelanceCommentInput } from '../constants';
import * as demandsService from './demands-service';

export const demandsRouter = router({
  addRelanceComment: route.input(zAddRelanceCommentInput).mutation(async ({ input }) => {
    const { relanceId, comment } = input;
    return await demandsService.updateCommentFromRelanceId(relanceId, comment);
  }),
});
