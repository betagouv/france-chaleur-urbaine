import { envBooleanSchema } from '@/utils/validation';

const cliConfig = {
  dryRun: envBooleanSchema.default(true).parse(process.env.DRY_RUN),
};

export default cliConfig;
