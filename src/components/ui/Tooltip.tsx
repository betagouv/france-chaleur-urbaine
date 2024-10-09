import { default as MUITooltip, TooltipProps as MUITooltipProps } from '@mui/material/Tooltip';
import styled from 'styled-components';

import Icon, { IconProps } from './Icon';

type TooltipProps = Omit<MUITooltipProps, 'children'> &
  Partial<Pick<MUITooltipProps, 'children'>> & {
    iconProps?: IconProps;
  };

const StyledIcon = styled(Icon)`
  align-self: start;
`;

export default function Tooltip({ children, iconProps, ...props }: TooltipProps) {
  return (
    <MUITooltip arrow {...props}>
      {children ?? <StyledIcon size="sm" name="ri-information-fill" cursor="help" {...iconProps} />}
    </MUITooltip>
  );
}
