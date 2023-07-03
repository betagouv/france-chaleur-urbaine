export const getConso = (conso: number) => {
  if (conso > 1000) {
    return `${(conso / 1000).toFixed(2)} GWh`;
  }

  return `${conso.toFixed(2)} MWh`;
};
