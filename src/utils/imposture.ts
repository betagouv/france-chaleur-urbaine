const IMPOSTURE_RETURN_PATH_KEY = 'imposture.returnPath';
const DEFAULT_RETURN_PATH = '/admin/impostures';

/**
 * Stores the current page before starting an impersonation, so we can return to it when it ends.
 * Uses localStorage to survive the full page reload triggered by the impersonation.
 */
export function saveImpostureReturnPath() {
  localStorage.setItem(IMPOSTURE_RETURN_PATH_KEY, window.location.pathname + window.location.search);
}

/**
 * Returns (and clears) the page stored before the impersonation, falling back to the impostures admin page.
 */
export function popImpostureReturnPath(): string {
  const path = localStorage.getItem(IMPOSTURE_RETURN_PATH_KEY);
  localStorage.removeItem(IMPOSTURE_RETURN_PATH_KEY);
  return path || DEFAULT_RETURN_PATH;
}
