import { withAuthentication } from '@/server/authentication';
import { userRolesWithPermissionsRenewableHeat } from '@/types/enum/UserRole';

export { default } from '@/modules/chaleur-renouvelable/client/DemandesChaleurRenouvelableCcrtPage';

export const getServerSideProps = withAuthentication(['admin', ...userRolesWithPermissionsRenewableHeat]);
