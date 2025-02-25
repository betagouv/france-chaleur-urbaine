import { atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type Session } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';

import { usePost, useFetch } from '@/hooks/useApi';
import { type UserPreferencesInput, type UserPreferences } from '@/pages/api/user/preferences';
import { type UserRole } from '@/types/enum/UserRole';

const authenticationAtom = atom<Session | null>(null);

/**
 * Hydrates the authentication atom with the session from the server.
 */
export const useInitAuthentication = (session: Session | undefined) => {
  useHydrateAtoms(new Map([[authenticationAtom, session]]));
};

/**
 * Returns the current session and user.
 */
export const useAuthentication = () => {
  const [session] = useAtom(authenticationAtom);

  return {
    session: session ?? null,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    hasRole: (role: UserRole) => session?.user && session?.user.role === role,
    signIn,
    signOut,
  };
};

/**
 * Returns the user preferences.
 */
export const useUserPreferences = () => {
  const { isAuthenticated } = useAuthentication();
  const { data: userPreferences } = useFetch<UserPreferences>('/api/user/preferences', { enabled: isAuthenticated });
  const { mutateAsync: updateUserPreferences } = usePost<UserPreferencesInput>('/api/user/preferences', {
    invalidate: ['/api/user/preferences'],
  });
  return { userPreferences, updateUserPreferences };
};
