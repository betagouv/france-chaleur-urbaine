import { withPartnerApi } from '@/modules/partner-api/server/authentication';
import { listDemands } from '@/modules/partner-api/server/handlers';

// GET /api/v2/demands — API partenaire (auth Bearer, org-scopée). Voir src/modules/partner-api.
export default withPartnerApi({ GET: listDemands });
