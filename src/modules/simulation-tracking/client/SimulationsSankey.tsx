import { useCallback, useMemo, useState } from 'react';
import { Layer, Rectangle, ResponsiveContainer, Sankey, type SankeyLinkProps, type SankeyNodeProps } from 'recharts';

import type { FunnelColumn, FunnelLink, FunnelNode, SimulationSankeyData } from './simulation-funnel';

type SimulationsSankeyProps = {
  data: SimulationSankeyData;
};

/** Wide nodes: the label and the volume are written inside, never over the links. */
const NODE_WIDTH = 160;
const NODE_PADDING = 40;
/** Vertical room per node of the fullest column: a three-line label plus its volume. */
const ROW_HEIGHT = 96;
const MIN_HEIGHT = 420;
const MAX_HEIGHT = 900;
const CHART_MARGIN = { bottom: 8, left: 8, right: 8, top: 8 };
const LABEL_GAP = 8;
const LINE_HEIGHT = 16;
const INNER_PADDING = 4;
/** Two lines inside a node: the room the smallest node should get before the chart stops growing. */
const COMPACT_LABEL_HEIGHT = 2 * LINE_HEIGHT + INNER_PADDING;
/** Characters per line inside a node (13 px font in 160 px). */
const MAX_CHARS_PER_LINE = 22;
/** Characters per line beside a node (12 px font): two such labels fit face to face in the gap at the minimum width. */
const MAX_CHARS_PER_OUTSIDE_LINE = 20;

type LabeledNode = FunnelNode & { value: number };

/** Hovered link, positioned at its middle in chart coordinates (the svg is rendered at its intrinsic size). */
type HoveredLink = { x: number; y: number; source: LabeledNode; target: LabeledNode; value: number };

/**
 * Entry → situation → outcome flow of the simulations. Every node carries its name and volume inside (beside it when the
 * node is too short), so identity never relies on color alone; share labels sit at the start of their link, where the
 * links of a node are still stacked and never cross. The chart keeps a minimum width and scrolls horizontally below it,
 * and grows in height with the fullest column. The tooltip is ours: the Recharts one hides on every mouse move over a
 * Sankey link.
 */
export function SimulationsSankey({ data }: SimulationsSankeyProps) {
  const [hoveredLink, setHoveredLink] = useState<HoveredLink | null>(null);
  const height = useMemo(() => chartHeight(data), [data]);
  const handleMouseEnter = useCallback((item: SankeyNodeProps | SankeyLinkProps, type: 'node' | 'link') => {
    if (type !== 'link' || !('sourceX' in item)) {
      return;
    }
    const link = item.payload as typeof item.payload & { source: LabeledNode; target: LabeledNode };
    setHoveredLink({
      source: link.source,
      target: link.target,
      value: link.value,
      x: (item.sourceX + item.targetX) / 2,
      y: (item.sourceY + item.targetY) / 2,
    });
  }, []);
  const handleMouseLeave = useCallback(() => setHoveredLink(null), []);

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-275">
        <ResponsiveContainer width="100%" height={height}>
          <Sankey
            data={data}
            nodeWidth={NODE_WIDTH}
            nodePadding={NODE_PADDING}
            margin={CHART_MARGIN}
            node={SankeyNode}
            link={SankeyLink}
            iterations={64}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </ResponsiveContainer>
        {hoveredLink && <LinkTooltip link={hoveredLink} />}
      </div>
    </div>
  );
}

/**
 * Chart height: a row per node of the fullest column, and enough for the smallest node to hold a compact label
 * (two lines), within a ceiling past which small nodes get their label beside them.
 */
const chartHeight = ({ nodes, links }: SimulationSankeyData) => {
  const values = nodeValues(nodes, links);
  const columns = Object.values(
    nodes.reduce(
      (byColumn, node, index) => {
        byColumn[node.column].push(values[index]);
        return byColumn;
      },
      { entry: [], outcome: [], situation: [] } as Record<FunnelColumn, number[]>
    )
  );
  const smallestValue = Math.min(...values.filter((value) => value > 0));
  const unit = COMPACT_LABEL_HEIGHT / smallestValue; // pixels per simulation so that the smallest node fits two lines
  const heightForSmallest = Math.max(
    ...columns.map((column) => column.reduce((sum, value) => sum + value, 0) * unit + NODE_PADDING * (column.length - 1))
  );
  const heightForRows = Math.max(...columns.map((column) => column.length)) * ROW_HEIGHT;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, heightForRows, heightForSmallest) + CHART_MARGIN.top + CHART_MARGIN.bottom);
};

/** Volume of each node, as Recharts sizes it: the larger of its incoming and outgoing flows. */
const nodeValues = (nodes: FunnelNode[], links: FunnelLink[]) =>
  nodes.map((_, index) => {
    const incoming = links.filter((link) => link.target === index).reduce((sum, link) => sum + link.value, 0);
    const outgoing = links.filter((link) => link.source === index).reduce((sum, link) => sum + link.value, 0);
    return Math.max(incoming, outgoing);
  });

/** Greedy word wrap; a single word longer than a line stays on its own line. */
const wrapLabel = (label: string, maxChars = MAX_CHARS_PER_LINE) =>
  label.split(' ').reduce<string[]>((lines, word) => {
    const lastLine = lines[lines.length - 1];
    return lastLine !== undefined && `${lastLine} ${word}`.length <= maxChars
      ? [...lines.slice(0, -1), `${lastLine} ${word}`]
      : [...lines, word];
  }, []);

/** First line of a multi-line label centered on `centerY`. */
const firstLineY = (centerY: number, lineCount: number) => centerY - ((lineCount - 1) * LINE_HEIGHT) / 2;

function SankeyNode({ x, y, width, height, payload }: SankeyNodeProps) {
  const node = payload as typeof payload & LabeledNode;
  const lines = wrapLabel(node.name);
  // Full label (name, then the volume on its own line), compact label (volume on the last line), or beside the node.
  const fitsFull = height >= (lines.length + 1) * LINE_HEIGHT + INNER_PADDING;
  const fitsCompact = height >= lines.length * LINE_HEIGHT + INNER_PADDING;
  const innerLines = fitsFull
    ? [...lines, String(node.value)]
    : lines.map((line, index) => (index === lines.length - 1 ? `${line} · ${node.value}` : line));
  return (
    <Layer>
      <Rectangle x={x} y={y} width={width} height={height} fill={node.fill} radius={3} />
      {fitsCompact ? (
        <text
          x={x + width / 2}
          y={firstLineY(y + height / 2, innerLines.length)}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pointer-events-none fill-white text-[13px] font-bold"
        >
          {innerLines.map((line, index) => (
            <tspan
              key={line}
              x={x + width / 2}
              dy={index === 0 ? 0 : LINE_HEIGHT}
              className={fitsFull && index === lines.length ? 'font-normal tabular-nums' : undefined}
            >
              {line}
            </tspan>
          ))}
        </text>
      ) : (
        <OutsideLabel node={node} x={x} y={y} width={width} height={height} />
      )}
    </Layer>
  );
}

type OutsideLabelProps = { node: LabeledNode; x: number; y: number; width: number; height: number };

/**
 * Label of a node too short to hold it, on the side of the node that carries no other text: the right for the entry
 * column (its thin links carry no share label), the left for the others (share labels sit at the start of the links,
 * on the far side of the gap). Haloed, since it lies over the links.
 */
function OutsideLabel({ node, x, y, width, height }: OutsideLabelProps) {
  const lines = wrapLabel(node.name, MAX_CHARS_PER_OUTSIDE_LINE);
  const isEntry = node.column === 'entry';
  const textX = isEntry ? x + width + LABEL_GAP : x - LABEL_GAP;
  const labelLines = lines.map((line, index) => (index === lines.length - 1 ? `${line} · ${node.value}` : line));
  return (
    <text
      x={textX}
      y={firstLineY(y + height / 2, labelLines.length)}
      textAnchor={isEntry ? 'start' : 'end'}
      dominantBaseline="middle"
      paintOrder="stroke"
      stroke="var(--background-default-grey)"
      strokeWidth={3}
      className="pointer-events-none fill-(--text-default-grey) text-xs"
    >
      {labelLines.map((line, index) => (
        <tspan key={line} x={textX} dy={index === 0 ? 0 : LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** Below this link thickness the share label would overflow the link: the tooltip still gives it. */
const MIN_LINK_WIDTH_FOR_LABEL = 24;
/** Position of the share label along the link: close to the source, where the links of a node are still stacked. */
const SHARE_LABEL_T = 0.15;

const shareLabel = (value: number, sourceValue: number) => `${Math.round((value / sourceValue) * 100)} %`;

/** Point of the cubic Bézier `start → control1 → control2 → end` at `t`. */
const bezier = (start: number, control1: number, control2: number, end: number, t: number) =>
  (1 - t) ** 3 * start + 3 * (1 - t) ** 2 * t * control1 + 3 * (1 - t) * t ** 2 * control2 + t ** 3 * end;

function SankeyLink({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }: SankeyLinkProps) {
  const source = payload.source as typeof payload.source & LabeledNode;
  const target = payload.target as typeof payload.target & FunnelNode;
  return (
    <Layer>
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={target.fill}
        strokeOpacity={0.3}
        strokeWidth={linkWidth}
      />
      {linkWidth >= MIN_LINK_WIDTH_FOR_LABEL && source.value > 0 && (
        <text
          x={bezier(sourceX, sourceControlX, targetControlX, targetX, SHARE_LABEL_T)}
          y={bezier(sourceY, sourceY, targetY, targetY, SHARE_LABEL_T)}
          textAnchor="middle"
          dominantBaseline="middle"
          paintOrder="stroke"
          stroke="var(--background-default-grey)"
          strokeWidth={3}
          className="pointer-events-none fill-(--text-default-grey) text-xs font-bold tabular-nums"
        >
          {shareLabel(payload.value, source.value)}
        </text>
      )}
    </Layer>
  );
}

type LinkTooltipProps = { link: HoveredLink };

/** Volume of the link and its share of the upstream node; never catches the pointer (no flicker). */
function LinkTooltip({ link }: LinkTooltipProps) {
  const share = link.source.value > 0 ? Math.round((link.value / link.source.value) * 100) : null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm border border-(--border-default-grey) bg-(--background-default-grey) px-3 py-2 text-sm shadow-sm"
      style={{ left: link.x, top: link.y - LABEL_GAP }}
    >
      <p className="mb-1 whitespace-nowrap font-bold">
        {link.source.name} → {link.target.name}
      </p>
      <p className="mb-0 whitespace-nowrap">
        {link.value} simulation{link.value > 1 ? 's' : ''}
        {share !== null && ` · ${share} % de « ${link.source.name} »`}
      </p>
    </div>
  );
}
