export const knownAirtableBases = {
  prod: 'app9opX8gRAtBqkan',
  'dev-clemence': 'appR5GR5w4miDnx2m',
  'dev-maxime': 'appEDC42gH0AnfHzM',
} as const;

export type KnownAirtableBase = keyof typeof knownAirtableBases;
