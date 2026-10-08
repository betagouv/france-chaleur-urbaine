import { Badge } from '@codegouvfr/react-dsfr/Badge';

import trpc from '@/modules/trpc/client';

/** Number of network change requests waiting for a review, shown next to the admin menu entry. Hidden when there is none. */
function PendingNetworkChangeRequestsBadge() {
  const { data: count } = trpc.networkChangeRequests.admin.countPending.useQuery(undefined, { refetchInterval: 60_000 });
  if (!count) {
    return null;
  }
  return (
    <Badge as="span" small severity="new" noIcon className="ml-2 align-middle">
      {count}
    </Badge>
  );
}

export default PendingNetworkChangeRequestsBadge;
