export const knownAirtableBases = {
  dev: 'app9Hn33eMoY4TP1t',
  prod: 'app9opX8gRAtBqkan',
} as const;

export type KnownAirtableBase = keyof typeof knownAirtableBases;
