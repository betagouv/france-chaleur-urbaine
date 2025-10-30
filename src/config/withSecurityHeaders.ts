import helmet from 'helmet';
import type { NextConfig } from 'next';

type CSPDirectives = Record<string, string[]>;

type SecurityHeadersConfig = {
  csp?: CSPDirectives;
};

const withSecurityHeaders = (config: SecurityHeadersConfig = {}) => {
  const { csp: customCsp } = config;

  return (nextConfig: NextConfig) => {
    const csp = {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      ...customCsp,
    } as CSPDirectives;

    if (process.env.UNSAFE_EVAL === 'true') {
      csp['script-src'].push("'unsafe-eval'");
    }

    const securityHeaders = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'Content-Security-Policy',
        value: Object.entries(csp)
          .map(([key, value]) => `${key} ${value.join(' ')}`)
          .join(';'),
      },
    ];

    const securityHeadersIFramable = [
      {
        key: 'Content-Security-Policy',
        value: Object.entries({
          ...csp,
          'frame-ancestors': ['*'],
        })
          .map(([key, value]) => `${key} ${value.join(' ')}`)
          .join(';'),
      },
    ];

    return {
      ...nextConfig,
      async headers() {
        const existingHeaders = nextConfig.headers ? await nextConfig.headers() : [];
        return [
          ...existingHeaders,
          {
            headers: securityHeaders,
            source: '/:path*',
          },
          {
            headers: securityHeadersIFramable,
            source: '/iframe/:path*',
          },
        ];
      },
    };
  };
};

export default withSecurityHeaders;
