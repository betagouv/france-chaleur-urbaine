import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { PublicPageSource } from '../constants';

type PublicPageContextValue = {
  source: PublicPageSource;
  /** Behaviour of the "Comparer les solutions" calls to action spread across the sections. */
  onCompareSolutions: () => void;
};

const PublicPageContext = createContext<PublicPageContextValue | null>(null);

export const scrollToPageTop = () => {
  window.scrollTo({ top: 0 });
};

type PublicPageProviderProps = {
  source: PublicPageSource;
  onCompareSolutions?: () => void;
  children: ReactNode;
};

/**
 * Page-level settings shared by the public sections: the analytics source that
 * prefixes their PostHog events and what the "Comparer les solutions" CTA does.
 */
export function PublicPageProvider({ source, onCompareSolutions = scrollToPageTop, children }: PublicPageProviderProps) {
  const value = useMemo(() => ({ onCompareSolutions, source }), [onCompareSolutions, source]);

  return <PublicPageContext.Provider value={value}>{children}</PublicPageContext.Provider>;
}

export function usePublicPage() {
  const context = useContext(PublicPageContext);
  if (!context) {
    throw new Error('usePublicPage must be used within a PublicPageProvider');
  }
  return context;
}
