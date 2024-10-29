import { fr } from '@codegouvfr/react-dsfr';
import React from 'react';
import { Oval } from 'react-loader-spinner';
import styled from 'styled-components';

type OvalProps = React.ComponentProps<typeof Oval>;

type LoaderProps = Omit<OvalProps, 'wrapperClass' | 'wrapperStyle'> & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
  className?: string;
};

const sizeMap = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 60,
};

const StyledOval = styled(Oval)`
  animation: spin 1s linear infinite;
`;

const Loader: React.FC<LoaderProps> = ({ size = 'sm', className, style, ...props }) => {
  const dimension = sizeMap[size];

  return (
    <StyledOval
      height={dimension}
      width={dimension}
      color={fr.colors.decisions.background.active.blueFrance.default}
      wrapperClass={className as OvalProps['wrapperClass']}
      wrapperStyle={style as OvalProps['wrapperStyle']}
      {...props}
    />
  );
};

export default Loader;
