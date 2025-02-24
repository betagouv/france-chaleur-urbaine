import { atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type Session } from 'next-auth';
import { signOut } from 'next-auth/react';

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
    hasRole: (role: UserRole) => session?.user && session?.user.role === role,
    signOut,
  };
};
