import helmet from 'helmet';
import type { NextConfig } from 'next';

type CSPDirectives = Record<string, string[]>;

type SecurityHeadersConfig = {
  iframes?: string[];
  csp?: CSPDirectives;
};

const withSecurityHeaders = (config: SecurityHeadersConfig = {}) => {
  const { iframes, csp: customCsp } = config;

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
        value: Object.keys(csp)
          .map((key) => `${key} ${csp[key].join(' ')}`)
          .join(';'),
      },
    ];

    const securityHeadersIFramable = [
      {
        key: 'X-Frame-Options',
        value: '',
      },
      {
        key: 'Content-Security-Policy',
        value: Object.keys(csp)
          .filter((key) => key !== 'frame-ancestors')
          .map((key) => `${key} ${csp[key].join(' ')}`)
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
          // Attention: keep in sync with src/services/iframe.ts
          ...(iframes || []).map((source) => ({
            headers: securityHeadersIFramable,
            source,
          })),
        ];
      },
    };
  };
};

export default withSecurityHeaders;
