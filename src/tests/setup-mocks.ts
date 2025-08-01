// Import React after mocks to ensure they're available
import React from 'react';
import { afterAll, afterEach, vi } from 'vitest';

// overridden in CI
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://fcu_test:fcu_test_pass@localhost:5433/fcu_test';

vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    pull: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: true,
    isReady: true,
    isPreview: false,
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
        func().then((module) => {
          setC(() => module.default || module);
        });
      }, []);
      return C ? React.createElement(C, props) : null;
    };
    return Component;
  },
}));

// Mock Services Context
vi.mock('@/services/context', () => ({
  ServicesContext: React.createContext({}),
  useServices: () => ({
    apiService: {},
    trackingService: {
      trackEvent: vi.fn(),
      trackAcquisition: vi.fn(),
    },
    heatNetworkService: {
      findByCoords: vi.fn().mockResolvedValue({
        isEligible: false,
        distance: 1000,
        networks: [],
      }),
      findById: vi.fn().mockResolvedValue(null),
    },
  }),
  ServicesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock fetch with proper responses
global.fetch = vi.fn().mockImplementation((url: string) => {
  // Block external URLs to prevent real requests
  if (url.includes('youtube.com') || url.includes('google.com') || url.startsWith('http')) {
    return Promise.reject(new Error('External requests blocked in tests'));
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: url || '',
    clone: () => ({ ok: true }),
    body: null,
    bodyUsed: false,
  } as Response);
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
  postFetchJSON: vi.fn().mockResolvedValue({}),
  postFormDataFetchJSON: vi.fn().mockResolvedValue({}),
  getFetchJSON: vi.fn().mockResolvedValue({}),
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
      placeholder: 'Rechercher une adresse',
      onChange: (e: any) => {
        // Simulate address selection
        if (e.target.value && onSelect) {
          onSelect({
            geometry: { coordinates: [2.3522, 48.8566] },
            properties: {
              label: e.target.value,
              city: 'Paris',
              citycode: '75001',
            },
          });
        }
      },
      ...props,
    });
  },
}));

// Mock iframe to prevent external content loading
Object.defineProperty(window.HTMLIFrameElement.prototype, 'src', {
  set: vi.fn(),
  get: vi.fn(() => ''),
});

// Mock window.open and other window methods
global.open = vi.fn();

// Restore console methods after tests
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  process.stderr.write = originalStderrWrite;
});
