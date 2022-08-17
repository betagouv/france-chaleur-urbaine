export const getGestionnaire = (addresse: string): string | null => {
  if (addresse && addresse.includes('Paris')) {
    return 'Paris';
  }

  return null;
};
