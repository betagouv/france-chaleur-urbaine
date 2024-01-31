export const knownAirtableBases = {
  prod: 'app9opX8gRAtBqkan',
  'dev-clemence': 'appR5GR5w4miDnx2m',
  'dev-maxime': 'app7BOYyhY2sAzuwo',
} as const;

export type KnownAirtableBase = keyof typeof knownAirtableBases;
