const HTML_ESCAPES: Record<string, string> = { "'": '&#39;', '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/** Escapes the characters that would be interpreted as HTML, for user text rendered with `dangerouslySetInnerHTML`. */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
