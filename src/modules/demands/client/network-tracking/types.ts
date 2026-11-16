import type { RouterOutput } from '@/modules/trpc/client';

export type NetworkTrackingSummary = RouterOutput['demands']['admin']['listNetworkTracking'][number];
export type NetworkTrackingDetail = RouterOutput['demands']['admin']['getNetworkTracking'];
