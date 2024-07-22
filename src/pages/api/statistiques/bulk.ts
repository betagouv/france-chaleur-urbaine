import { handleRouteErrors } from '@helpers/server';
import db from 'src/db';

export default handleRouteErrors(async () => {
  const data = await db('eligibility_tests').select().whereNull('in_error').orderBy('created_at', 'asc');

  const defaultMonthValue = {
    nbTotal: 0,
    nbEligible: 0,
    nbUneligible: 0,
  };

  return data.reduce((acc, value) => {
    const date: Date = new Date(value.created_at);
    const keys = date.toISOString().split('T')[0].split('-');
    const key = `${keys[0]}-${keys[1]}`;

    const current = {
      ...(acc[key] || defaultMonthValue),
    };

    current.nbTotal += value.addresses_count - value.error_count;
    current.nbEligible += value.eligibile_count;
    current.nbUneligible = current.nbTotal - current.nbEligible;

    return !key
      ? acc
      : {
          ...acc,
          [key]: current,
        };
  }, {});
});
