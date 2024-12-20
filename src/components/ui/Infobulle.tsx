import React from 'react';
import styled from 'styled-components';

import Hoverable, { type HoverableProps } from '@/components/Hoverable';
import Icon, { type IconProps } from '@/components/ui/Icon';

type InfobulleProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'size'> & {
  name?: IconProps['name'];
  position?: HoverableProps['position'];
};

export const InfoIcon = styled.span`
  position: relative;
  align-self: flex-start;
  margin-left: auto;

  & > .hover-info {
    width: 250px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;

const Infobulle: React.FC<InfobulleProps> = ({ children, name = 'ri-information-fill', position = 'bottom', className, ...props }) => {
  return (
    <InfoIcon className={className} {...props}>
      <Icon size="sm" name={name} cursor="help" />

      <Hoverable position={position as InfobulleProps['position']}>{children}</Hoverable>
    </InfoIcon>
  );
};

export default Infobulle;
