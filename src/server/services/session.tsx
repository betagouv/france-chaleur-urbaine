import { type Session } from 'next-auth';
import React, { type ReactNode } from 'react';

type SessionContextValue = {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (data: any) => Promise<Session | null>;
};

type SessionProviderProps = {
  children: ReactNode;
  session?: Session | null;
  basePath?: string;
  refetchInterval?: number;
  refetchWhenOffline?: boolean;
  refetchOnWindowFocus?: boolean;
};

// Mock context
export const SessionContext = React.createContext<SessionContextValue>({
  data: null,
  status: 'unauthenticated',
  update: async () => null,
});

// Mock provider
export const SessionProvider = ({ session, children }: SessionProviderProps) => {
  const value = React.useMemo(
    () => ({
      data: session,
      status: session ? 'authenticated' : 'unauthenticated',
      update: async () => session,
    }),
    [session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

// Mock sign in function
export const signIn = async () => {
  return {
    error: null,
    status: 200,
    ok: true,
    url: null,
  };
};

// Mock sign out function
export const signOut = async () => {
  return {
    url: '/',
  };
};

// Mock get session function
export const getSession = async () => {
  return null;
};

// Mock get CSRF token function
export const getCsrfToken = async () => {
  return '';
};

// Mock use session hook
export const useSession = () => {
  return {
    data: null,
    status: 'unauthenticated',
    update: async () => null,
  } as const;
};
