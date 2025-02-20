import { atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type Session } from 'next-auth';

const authenticationAtom = atom<Session | null>(null);

/**
 * Hydrates the authentication atom with the session from the server.
 */
export const useHydrateAuthentication = (session: Session | undefined) => {
  useHydrateAtoms(new Map([[authenticationAtom, session]]));
};

/**
 * Returns the current session and user.
 */
export const useAuthentication = () => {
  const [session] = useAtom(authenticationAtom);
  return session
    ? ({ isAuthenticated: true, session, user: session.user } as const)
    : ({ isAuthenticated: false, session: null, user: null } as const);
};
