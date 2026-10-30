import { atom, useAtom, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useQueryState } from 'nuqs';
import { useEffect } from 'react';

import useCookie from '@/hooks/useCookie';
import type { UserRole } from '@/types/enum/UserRole';
import { stripDomainFromURL } from '@/utils/url';

const authenticationAtom = atom<Session | null>(null);

export const useRedirectionAfterLogin = (session?: Session | null) => {
  const [callbackUrlCookie, setCallbackUrlCookie, removeCookie] = useCookie('callbackUrl');
  const [callbackUrlQueryParam, setCallbackUrlQueryParam] = useQueryState('callbackUrl');
  const router = useRouter();
  useEffect(() => {
    // if the user is not authenticated, we save the callbackUrl in a cookie
    if (!session && callbackUrlQueryParam) {
      setCallbackUrlCookie(callbackUrlQueryParam);
      void setCallbackUrlQueryParam(null);
    }

    if (session && callbackUrlCookie) {
      removeCookie();
      router.push(stripDomainFromURL(callbackUrlCookie) ?? '/pro/tableau-de-bord');
    }
  }, [session, callbackUrlQueryParam, setCallbackUrlCookie, setCallbackUrlQueryParam, removeCookie, router, callbackUrlCookie]);
};

/**
 * Hydrates the authentication atom with the session from the server.
 */
export const useInitAuthentication = (serverSession: Session | undefined) => {
  useHydrateAtoms(new Map([[authenticationAtom, serverSession]]));
  const { data: updatedSession } = useSession();

  const session = serverSession ?? updatedSession;
  const setAuthenticationAtom = useSetAtom(authenticationAtom);
  useEffect(() => {
    setAuthenticationAtom(updatedSession ?? null);
  }, [updatedSession, setAuthenticationAtom]);

  useRedirectionAfterLogin(session);
};

/**
 * Returns the current session and user.
 */
export const useAuthentication = () => {
  const [session] = useAtom(authenticationAtom);
  return {
    hasRole: (role: UserRole) => session?.user && session?.user.role === role,
    isAuthenticated: !!session?.user, // a session pending the admin second factor carries no user
    session: session ?? null,
    signIn,
    signOut,
    user: session?.user ?? null,
  };
};
