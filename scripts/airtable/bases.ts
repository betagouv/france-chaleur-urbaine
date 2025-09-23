export const knownAirtableBases = {
  prod: 'app9opX8gRAtBqkan',
  dev: 'app9Hn33eMoY4TP1t',
} as const;

export type KnownAirtableBase = keyof typeof knownAirtableBases;
