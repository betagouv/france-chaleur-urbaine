import { withPartnerApi } from '@/modules/partner-api/server/authentication';
import { patchDemand } from '@/modules/partner-api/server/handlers';

// PATCH /api/v2/demands/{id} — met à jour statut + commentaire. Voir src/modules/partner-api.
export default withPartnerApi({ PATCH: patchDemand });
