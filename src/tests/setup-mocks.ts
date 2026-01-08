// biome-ignore-all lint/complexity/useArrowFunction: Vitest 4 requires function syntax for constructors in mocks (see https://vitest.dev/guide/migration.html#spyon-and-fn-support-constructors)

// Import React after mocks to ensure they're available
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterAll, afterEach, vi } from 'vitest';

// overridden in CI
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://fcu_test:fcu_test_pass@localhost:5433/fcu_test';

// Mock server/config which internally requires client-config
// This prevents the "Cannot find module '@/client-config'" error in tests
vi.mock('@/server/config', () => ({
  clientConfig: {
    banApiBaseUrl: 'https://data.geopf.fr/geocodage/search/',
    calendarLink: 'https://cal.com/test',
    contactEmail: 'test@example.com',
    destinationEmails: {
      carto: 'test@example.com',
      comparateur: 'test@example.com',
      contact: 'test@example.com',
      contribution: 'test@example.com',
      pro: 'test@example.com',
    },
    flags: {
      enableComparateurWidget: false,
    },
    linkedInUrl: 'https://www.linkedin.com/test',
    networkInfoFieldMaxCharacters: 700,
    networkSearchMinimumCharactersThreshold: 3,
    publicodesDocumentationURL: 'https://test.example.com',
    summaryAreaSizeLimit: 5,
    tracking: {
      googleTagIds: [],
      hotjarId: undefined,
      hotjarSv: undefined,
      linkInPartnerId: undefined,
      matomoServerURL: undefined,
      matomoSiteId: undefined,
    },
    websiteOrigin: undefined,
  },
  serverConfig: {
    // Required for tRPC tests that import modules using Airtable
    AIRTABLE_KEY_API: 'test_airtable_key',
    contactEmail: 'test@example.com',
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://fcu_test:fcu_test_pass@localhost:5433/fcu_test',
  },
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/',
    back: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      emit: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: true,
    isPreview: false,
    isReady: true,
    pathname: '/',
    prefetch: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    query: {},
    route: '/',
  }),
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next/dynamic', () => ({
  default: (func: () => Promise<any>) => {
    const Component = (props: any) => {
      const [C, setC] = React.useState(null);
      React.useEffect(() => {
        void func().then((module) => {
          setC(() => module.default || module);
        });
      }, []);
      return C ? React.createElement(C, props) : null;
    };
    return Component;
  },
}));

// Mock tRPC client to avoid provider requirements in tests
vi.mock('@/modules/trpc/client', () => ({
  __esModule: true,
  default: {
    // Minimal context hook to satisfy consumers that read it
    useContext: () => ({}),
    // Provide utils with a minimal client shape used in components
    useUtils: () => ({
      client: {
        reseaux: {
          cityNetwork: { query: vi.fn().mockResolvedValue({}) },
          eligibilityStatus: { query: vi.fn().mockResolvedValue({}) },
        },
      },
    }),
    // No-op HOC: returns the component unchanged
    withTRPC: (App: any) => (props: any) => React.createElement(App, props),
  },
}));

// Mock fetch with proper responses
global.fetch = vi.fn().mockImplementation((url: string) => {
  // Block external URLs to prevent real requests
  if (url.includes('youtube.com') || url.includes('google.com') || url.startsWith('http')) {
    return Promise.reject(new Error('External requests blocked in tests'));
  }

  return Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    body: null,
    bodyUsed: false,
    clone: () => ({ ok: true }),
    headers: new Headers(),
    json: () => Promise.resolve({}),
    ok: true,
    redirected: false,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
    type: 'basic',
    url: url || '',
  } as Response);
});

global.ResizeObserver = vi.fn().mockImplementation(function () {
  return {
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  };
});

global.IntersectionObserver = vi.fn().mockImplementation(function () {
  return {
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  };
});

// Mock console methods to suppress warnings in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalStderrWrite = process.stderr.write;

console.error = (...args: any[]) => {
  // Suppress specific warnings/errors
  const message = args[0]?.toString?.() || '';
  if (
    message.includes('fetch operation was aborted') ||
    message.includes('AbortError') ||
    message.includes('The operation was aborted') ||
    message.includes('NetworkError') ||
    message.includes('Failed to execute "fetch()"') ||
    message.includes('youtube.com') ||
    message.includes('React does not recognize') ||
    message.includes('Invalid prop') ||
    message.includes('Encountered two children with the same key')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  const message = args[0]?.toString?.() || '';
  if (
    message.includes('fetch operation was aborted') ||
    message.includes('AbortError') ||
    message.includes('React does not recognize') ||
    message.includes('Received `true` for a non-boolean attribute') ||
    message.includes('customSize')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Mock stderr to suppress React warnings
process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
  const message = chunk?.toString?.() || '';
  if (
    message.includes('React does not recognize') ||
    message.includes('Received `true` for a non-boolean attribute') ||
    message.includes('customSize') ||
    message.includes('show')
  ) {
    // Suppress the warning
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof callback === 'function') {
      callback();
    }
    return true;
  }
  return originalStderrWrite.call(process.stderr, chunk, encoding, callback);
}) as any;

// Mock API utility functions
vi.mock('@/utils/api', () => ({
  getFetchJSON: vi.fn().mockResolvedValue({}),
  postFetchJSON: vi.fn().mockResolvedValue({}),
  postFormDataFetchJSON: vi.fn().mockResolvedValue({}),
}));

// Mock authentication
export const mockGetServerSession = vi.fn();
vi.mock('@/server/authentication', () => ({
  getServerSession: mockGetServerSession,
}));

// Mock AddressAutocomplete
vi.mock('@/components/addressAutocomplete/AddressAutocomplete', () => ({
  default: ({ onSelect, ...props }: any) => {
    return React.createElement('input', {
      'data-testid': 'address-autocomplete',
      onChange: (e: any) => {
        // Simulate address selection
        if (e.target.value && onSelect) {
          onSelect({
            geometry: { coordinates: [2.3522, 48.8566] },
            properties: {
              city: 'Paris',
              citycode: '75001',
              label: e.target.value,
            },
          });
        }
      },
      placeholder: 'Rechercher une adresse',
      ...props,
    });
  },
}));

// Mock iframe to prevent external content loading
Object.defineProperty(window.HTMLIFrameElement.prototype, 'src', {
  get: vi.fn(() => ''),
  set: vi.fn(),
});

// Mock window.open and other window methods
global.open = vi.fn();

// Clean up after each test
afterEach(() => {
  cleanup(); // Clean up React Testing Library DOM between tests
  vi.clearAllMocks();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  process.stderr.write = originalStderrWrite;
});
