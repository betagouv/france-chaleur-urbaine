import Hoverable from '@components/Hoverable';
import { ReactNode } from 'react';
import { StyledTooltip } from './Tooltip.style';

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
