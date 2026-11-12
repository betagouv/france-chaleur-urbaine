import trpc from '@/modules/trpc/client';

/**
 * Returns a function refetching the network tracking list and detail, to call after a change made from either screen.
 */
export const useNetworkTrackingRefresh = () => {
  const utils = trpc.useUtils();
  return async () => {
    await Promise.all([utils.demands.admin.listNetworkTracking.invalidate(), utils.demands.admin.getNetworkTracking.invalidate()]);
  };
};
