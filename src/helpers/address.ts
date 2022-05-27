const idfPostCodePrefix: string[] = [
  '75',
  '77',
  '78',
  '91',
  '92',
  '93',
  '94',
  '95',
];

export const isIDF = (postCode: string): boolean =>
  idfPostCodePrefix.includes(postCode.slice(0, 2));
