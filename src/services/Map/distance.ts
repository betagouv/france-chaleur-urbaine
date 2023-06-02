export const getReadableDistance = (distance?: number | null) => {
  if (distance === null || distance === undefined) {
    return '';
  }

  if (distance < 1) {
    return "< 1m à vol d'oiseau";
  }
  if (distance >= 1000) {
    return `${distance / 1000}km à vol d'oiseau`;
  }
  return `${distance}m à vol d'oiseau`;
};
