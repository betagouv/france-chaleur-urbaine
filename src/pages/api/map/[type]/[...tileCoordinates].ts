// disable the warning for this route as many tiles are bigger than the default 4MB threshold
export const config = {
  api: {
    responseLimit: false,
  },
};

export { default } from '@/modules/tiles/server/api';
