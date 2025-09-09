import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';

import { type AppRouter } from './types';

export { default } from './client/next';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
