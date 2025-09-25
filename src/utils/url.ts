/**
 * Ensure the path is relative to the current domain.
 * This is useful to prevent redirecting to an external domain.
 * @param path the path to check
 * @returns the relative path
 */
export const stripDomainFromURL = (path: string | null): string | null => {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  try {
    const url = new URL(path, 'https://dummy'); // normalize using a dummy base URL
    // remove multiple slashes
    const normalizedPathname = url.pathname.replace(/\/+/g, '/');
    return normalizedPathname + url.search + url.hash;
  } catch {
    return null;
  }
};
