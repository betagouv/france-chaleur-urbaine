export const knownAirtableBases = {
  dev: 'appkX1cuvtl7sZ8Il',
  prod: 'app9opX8gRAtBqkan',
} as const;

export type KnownAirtableBase = keyof typeof knownAirtableBases;
