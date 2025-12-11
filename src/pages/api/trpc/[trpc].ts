export { default } from '@/modules/trpc/server/api';

// Increase body size limit for tRPC mutations handling large payloads.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
