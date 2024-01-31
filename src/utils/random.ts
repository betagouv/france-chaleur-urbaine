/**
 * Generage a random v4 UUID. Do not use in secure contexts, only for good enough randomness.
 * eg: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export const getUuid = (a: string = ''): string =>
  a
    ? ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, getUuid);
