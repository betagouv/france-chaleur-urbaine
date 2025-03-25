import { fr } from '@codegouvfr/react-dsfr';
import { cva } from 'class-variance-authority';
import React from 'react';
import { Oval } from 'react-loader-spinner';

import cx from '@/utils/cx';

type OvalProps = React.ComponentProps<typeof Oval>;

type LoaderProps = Omit<OvalProps, 'wrapperClass' | 'wrapperStyle'> & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
  className?: string;
  variant?: 'section';
};

const sizeMap = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 60,
};

const loaderVariants = cva('[&_svg]:animate-spin', {
  variants: {
    variant: {
      section: 'flex justify-center my-12',
    },
  },
});

const Loader: React.FC<LoaderProps> = ({ size = 'sm', variant, className, style, ...props }) => {
  const dimension = sizeMap[size];

  return (
    <Oval
      height={dimension}
      width={dimension}
      color={fr.colors.decisions.background.active.blueFrance.default}
      wrapperClass={cx(loaderVariants({ variant }), className) as OvalProps['wrapperClass']}
      wrapperStyle={style as OvalProps['wrapperStyle']}
      {...props}
    />
  );
};

export default Loader;
