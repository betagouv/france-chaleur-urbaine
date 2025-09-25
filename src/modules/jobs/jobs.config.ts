import { processProEligibilityTestJob } from '@/modules/pro-eligibility-tests/server/jobs';
import { processBuildTilesJob, processSyncGeometriesToAirtableJob, processSyncMetadataFromAirtableJob } from '@/modules/tiles/server/jobs';

export const jobHandlers = {
  pro_eligibility_test: processProEligibilityTestJob,
  build_tiles: processBuildTilesJob,
  sync_geometries_to_airtable: processSyncGeometriesToAirtableJob,
  sync_metadata_from_airtable: processSyncMetadataFromAirtableJob,
} as const;
