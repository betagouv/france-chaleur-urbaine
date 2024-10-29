import MuiDrawer, { type DrawerProps as MuiDrawerProps } from '@mui/material/Drawer';
import styled from 'styled-components';

import Icon from './Icon';

interface DrawerProps {
  children: MuiDrawerProps['children'];
  anchor: MuiDrawerProps['anchor'];
  onClose: MuiDrawerProps['onClose'];
  open: MuiDrawerProps['open'];
}

const CloseIcon = styled(Icon)`
  cursor: pointer;
  text-align: right;
  &:hover {
    opacity: 0.7;
  }
`;

const Drawer = ({ children, ...props }: DrawerProps) => {
  return (
    <MuiDrawer {...props}>
      <CloseIcon name="fr-icon-close-line" size="lg" onClick={(e) => props.onClose?.(e, 'backdropClick')} />
      {children}
    </MuiDrawer>
  );
};

export default Drawer;
