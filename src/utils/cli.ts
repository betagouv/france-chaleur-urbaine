/**
 * Create a terminal link to the given URL (ANSI OSC 8).
 */
export function terminalLink(url: string, label?: string) {
  return `\x1b]8;;${label ?? url}\x1b\\${url}\x1b]8;;\x1b\\`;
}
