import { processScanFileJob } from '@/modules/files/server/jobs';
import { processParseRequestGeometriesJob } from '@/modules/network-change-requests/server/jobs';
import { processProEligibilityTestJob, processWarnEligibilityChangesJob } from '@/modules/pro-eligibility-tests/server/jobs';
import { processBuildTilesJob } from '@/modules/tiles/server/jobs';

export const jobHandlers = {
  build_tiles: processBuildTilesJob,
  parse_request_geometries: processParseRequestGeometriesJob,
  pro_eligibility_test: processProEligibilityTestJob,
  pro_eligibility_test_notify_changes: processWarnEligibilityChangesJob,
  scan_file: processScanFileJob,
} as const;
