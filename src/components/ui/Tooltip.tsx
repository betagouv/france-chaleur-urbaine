import { styled } from '@mui/material';
import { default as MUITooltip, TooltipProps as MUITooltipProps, tooltipClasses } from '@mui/material/Tooltip';

import Icon, { IconProps } from './Icon';

type TooltipProps = Omit<MUITooltipProps, 'children'> &
  Partial<Pick<MUITooltipProps, 'children'>> & {
    iconProps?: Partial<IconProps>;
  };

const StyledIcon = styled(Icon)`
  align-self: start;
  line-height: 1em !important;
`;

const DSFRLikeStyledTooltip = styled(({ className, ...props }: MUITooltipProps) => (
  <MUITooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgb(58, 58, 58)',
    boxShadow: theme.shadows[2],
    lineHeight: '14px',
    fontSize: '12px',
    padding: '8px',
  },
  [`& .${tooltipClasses.tooltip} .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.white,
  },
}));

export default function Tooltip({ children, iconProps, placement, ...props }: TooltipProps) {
  return (
    // Un composant react-dsfr devrait arriver bientôt https://github.com/codegouvfr/react-dsfr/pull/190)
    <DSFRLikeStyledTooltip arrow placement={placement ?? 'top'} {...props}>
      {children ?? <StyledIcon size="sm" name="ri-information-fill" cursor="help" {...iconProps} />}
    </DSFRLikeStyledTooltip>
  );
}
