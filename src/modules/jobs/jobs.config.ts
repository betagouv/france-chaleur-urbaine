import { processProEligibilityTestJob, processWarnEligibilityChangesJob } from '@/modules/pro-eligibility-tests/server/jobs';
import { processBuildTilesJob, processSyncGeometriesToAirtableJob, processSyncMetadataFromAirtableJob } from '@/modules/tiles/server/jobs';

export const jobHandlers = {
  build_tiles: processBuildTilesJob,
  pro_eligibility_test: processProEligibilityTestJob,
  sync_geometries_to_airtable: processSyncGeometriesToAirtableJob,
  sync_metadata_from_airtable: processSyncMetadataFromAirtableJob,
  warn_eligibility_changes: processWarnEligibilityChangesJob,
} as const;
