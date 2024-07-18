import { ReactNode } from 'react';

import Hoverable from '@components/Hoverable';

import { SpacingProperties, spacingsToClasses } from './helpers/spacings';
import { StyledSimpleTooltip, StyledSimpleTooltipContent, StyledTooltip } from './Tooltip.style';

interface TooltipProps {
  children: ReactNode;
  icon: ReactNode;
}

function Tooltip(props: TooltipProps) {
  return (
    <StyledTooltip>
      {props.icon}
      <Hoverable position="top-centered">{props.children}</Hoverable>
    </StyledTooltip>
  );
}
export default Tooltip;

interface SimpleTooltipProps extends SpacingProperties {
  children: ReactNode;
  icon: ReactNode;
  className?: string;
}

/**
 * Tooltip that extends its width to the parent container.
 * The tooltip appears on top.
 */
export function SimpleTooltip(props: SimpleTooltipProps) {
  return (
    <>
      <StyledSimpleTooltip className={`${spacingsToClasses(props)} ${props.className ?? ''}`}>{props.icon}</StyledSimpleTooltip>
      <StyledSimpleTooltipContent>{props.children}</StyledSimpleTooltipContent>
    </>
  );
}
