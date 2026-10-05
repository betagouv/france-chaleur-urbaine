import PendingNetworkChangeRequestsBadge from '@/modules/network-change-requests/client/PendingNetworkChangeRequestsBadge';

import type { AdminPage } from './adminPages';

type AdminPageMenuLabelProps = {
  page: AdminPage;
};

/** Label of an admin page in the navigation menu, with the pending counter for the pages that have one. */
function AdminPageMenuLabel({ page }: AdminPageMenuLabelProps) {
  return (
    <>
      {page.label}
      {page.href === '/admin/modifications-reseau' && <PendingNetworkChangeRequestsBadge />}
    </>
  );
}

export default AdminPageMenuLabel;
