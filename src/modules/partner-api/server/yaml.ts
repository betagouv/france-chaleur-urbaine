// Émetteur YAML minimal pour des données JSON-compatibles (objets / tableaux / scalaires).
// Astuce de robustesse : toute chaîne non triviale est émise via JSON.stringify — une chaîne JSON
// est un scalaire YAML double-quote valide (mêmes échappements). Aucun risque sur `:`, `#`, accents…

const SAFE_PLAIN = /^[A-Za-z][\w .()/-]*$/;
const RESERVED = /^(?:true|false|null|yes|no|on|off|~)$/i;

const emitScalar = (value: string | number | boolean | null): string => {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (value !== '' && value === value.trim() && SAFE_PLAIN.test(value) && !RESERVED.test(value)) return value;
  return JSON.stringify(value);
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const emitMapping = (obj: Record<string, unknown>, indent: string): string => {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const k = emitScalar(key);
    if (isRecord(value)) {
      const keys = Object.keys(value).filter((kk) => value[kk] !== undefined);
      lines.push(keys.length === 0 ? `${indent}${k}: {}` : `${indent}${k}:\n${emitMapping(value, `${indent}  `)}`);
    } else if (Array.isArray(value)) {
      lines.push(value.length === 0 ? `${indent}${k}: []` : `${indent}${k}:\n${emitSequence(value, `${indent}  `)}`);
    } else {
      lines.push(`${indent}${k}: ${emitScalar(value as string | number | boolean | null)}`);
    }
  }
  return lines.join('\n');
};

const emitSequence = (arr: unknown[], indent: string): string =>
  arr
    .map((item) => {
      if (isRecord(item) || Array.isArray(item)) {
        const inner = isRecord(item) ? emitMapping(item, `${indent}  `) : emitSequence(item, `${indent}  `);
        const innerLines = inner.split('\n');
        innerLines[0] = `${indent}- ${innerLines[0].slice(indent.length + 2)}`;
        return innerLines.join('\n');
      }
      return `${indent}- ${emitScalar(item as string | number | boolean | null)}`;
    })
    .join('\n');

/** Sérialise un objet JSON-compatible en YAML (ordre des clés = ordre d'insertion). */
export const toYaml = (doc: object): string => `${emitMapping(doc as Record<string, unknown>, '')}\n`;
