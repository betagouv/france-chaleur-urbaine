const idfPrefixes = ['75', '77', '78', '91', '92', '93', '94', '95'];
const cityManaged = ['Rennes', 'Bordeaux'];

export const isBasedOnIRIS = (postCode: string, city: string): boolean =>
  !cityManaged.includes(city) &&
  (!postCode || !idfPrefixes.includes(postCode.slice(0, 2)));
