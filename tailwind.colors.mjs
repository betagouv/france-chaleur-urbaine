// This file is a workaround for Turbopack module resolution issues in Next.js 16
// It re-exports colors from the TypeScript file in a format that Turbopack can handle
// See: https://github.com/vercel/next.js/issues/87898

import colors from './src/components/ui/helpers/colors.ts';

export default colors;
