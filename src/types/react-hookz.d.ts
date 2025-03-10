declare module '@react-hookz/web/useCookieValue' {
  type CookieAttributes = {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };

  export type UseCookieOptions = CookieAttributes & {
    initializeWithValue?: boolean;
  };

  export type UseCookieReturn = [value: undefined | null | string, set: (value: string) => void, remove: () => void, fetch: () => void];

  export function useCookieValue(key: string, options?: UseCookieOptions): UseCookieReturn;
}
