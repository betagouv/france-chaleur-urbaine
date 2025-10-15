import { processProEligibilityTestJob, processWarnEligibilityChangesJob } from '@/modules/pro-eligibility-tests/server/jobs';
import { processBuildTilesJob, processSyncGeometriesToAirtableJob, processSyncMetadataFromAirtableJob } from '@/modules/tiles/server/jobs';

export const jobHandlers = {
  build_tiles: processBuildTilesJob,
  pro_eligibility_test: processProEligibilityTestJob,
  pro_eligibility_test_notify_changes: processWarnEligibilityChangesJob,
  sync_geometries_to_airtable: processSyncGeometriesToAirtableJob,
  sync_metadata_from_airtable: processSyncMetadataFromAirtableJob,
} as const;
