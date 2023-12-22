import { fetchFromMatomo } from '../../../services/matomo';
import { handleRouteErrors } from '@helpers/server';

export default handleRouteErrors(async () => {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const display = 12 * (year - 2021) + (month - 6);
  currentDate.setMonth(currentDate.getMonth() - 1);
  currentDate.setDate(1);
  const result = await fetchFromMatomo(
    {
      method: 'VisitsSummary.get',
      period: 'month',
    },
    Array(display)
      .fill(null)
      .map((v, i) => {
        const baseDate = new Date(currentDate.toDateString());
        baseDate.setMonth(baseDate.getMonth() - i);
        const date = `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${baseDate.getDate().toString().padStart(2, '0')}`;
        return {
          date,
        };
      }),
    true
  );
  return { result };
});
