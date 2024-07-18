export const shuffleArray = <T extends object>(array: T[]): T[] => {
  return array
    .map((item) => ({ ...item, sort: Math.random() }))
    .sort((a, b) => (a as any).sort - (b as any).sort)
    .map(({ sort, ...rest }) => rest as T);
};
