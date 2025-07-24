// Attention, il faut référencer explicitement chaque variable process.env.NEXT_PUBLIC_*

import { envBooleanSchema } from '@/utils/validation';

const cliConfig = {
  dryRun: envBooleanSchema.default(true).parse(process.env.DRY_RUN),
};

export default cliConfig;
