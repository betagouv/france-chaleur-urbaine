import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { dayjs } from '@/utils/date';

import type { NetworkTrackingDetail } from './types';

const CHART_HEIGHT = 260;
// pair checked for colour-blind separation and contrast on light and dark surfaces
const RECEIVED_COLOR = '#6A6AF4';
const HANDLED_COLOR = '#B34000';

type NetworkActivityChartProps = {
  months: NetworkTrackingDetail['months'];
};

/**
 * Monthly bars comparing the demands a network received with the demands its managers acted on.
 */
export function NetworkActivityChart({ months }: NetworkActivityChartProps) {
  const data = months.map((month) => ({ ...month, label: dayjs(month.month).format('MMM YY') }));
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
        <Tooltip />
        <Legend formatter={(label: string) => <span className="text-sm text-(--text-default-grey)">{label}</span>} />
        <Bar
          dataKey="received"
          name="Demandes reçues"
          fill={RECEIVED_COLOR}
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        />
        <Bar
          dataKey="handled"
          name="Demandes traitées par un gestionnaire"
          fill={HANDLED_COLOR}
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
