// Import React after mocks to ensure they're available
import React from 'react';
import { vi } from 'vitest';

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
  }),
  ServicesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

global.fetch = vi.fn();

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

// Import React after mocks to ensure they're available
// eslint-disable-next-line import/order
// import React from 'react';
