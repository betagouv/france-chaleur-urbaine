import cx from '@/utils/cx';

/** Discriminated swatch primitive (`circle` / `square` / `line` / `polygon`). */

const BASE = 'mt-1 inline-block shrink-0';

export type LegendIconProps =
  | { type: 'circle' | 'square'; color: string; opacity?: number; stroke?: string; strokeWidth?: number }
  | { type: 'line'; color: string; thickness?: number }
  | { type: 'polygon'; stroke: string; fill?: string; fillOpacity?: number; strokeWidth?: number };

export function LegendIcon(props: LegendIconProps) {
  switch (props.type) {
    case 'circle':
    case 'square':
      return (
        <span
          aria-hidden
          className={cx(BASE, 'size-4', props.type === 'circle' ? 'rounded-full' : 'rounded-sm')}
          style={{
            backgroundColor: props.color,
            border: props.stroke ? `${props.strokeWidth ?? 2}px solid ${props.stroke}` : undefined,
            opacity: props.opacity,
          }}
        />
      );
    case 'line':
      return (
        <span
          aria-hidden
          className="mt-2 inline-block w-4 shrink-0 rounded-full"
          style={{ backgroundColor: props.color, height: `${props.thickness ?? 2}px` }}
        />
      );
    case 'polygon':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25 25" aria-hidden className={BASE}>
          <path
            fill={props.fill ?? props.stroke}
            fillOpacity={props.fillOpacity ?? 0.3}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth ?? 3}
            d="m2 2 22 10v11H2V2Z"
          />
        </svg>
      );
  }
}
