import Image from 'next/image';
import React from 'react';

const myLoader = ({ src, width, quality }: any) => {
  return `${src}?w=${width}&q=${quality || 75}`;
};

function CustomImage(
  props: Record<'src' | 'alt' | 'width' | 'height', any> & {
    className?: string;
  }
) {
  return <Image loader={myLoader} {...props} />;
}

export default CustomImage;
