import { buildNetworkTrackingUrl } from '@/modules/demands/client/network-tracking/format';
import { zNetworkTrackingInput } from '@/modules/demands/constants';
import { getParentNetworkId } from '@/modules/demands/server/network-tracking';
import { withAuthentication } from '@/server/authentication';

export { default } from '@/modules/demands/client/network-tracking/NetworkTrackingDetailPage';

// an extension linked to a heat network has no tracking of its own: its former URL leads to its parent network
export const getServerSideProps = withAuthentication(['admin'], async ({ context }) => {
  const network = zNetworkTrackingInput.safeParse({
    networkId: Number(context.params?.networkId),
    networkType: context.params?.networkType,
  });
  const parentNetworkId = network.success ? await getParentNetworkId(network.data) : null;
  return parentNetworkId
    ? { redirect: { destination: buildNetworkTrackingUrl('reseau_de_chaleur', parentNetworkId), permanent: false } }
    : { props: {} };
});
