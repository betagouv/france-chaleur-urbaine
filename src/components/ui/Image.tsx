import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import React from 'react';

import Markdown from '@/components/ui/Markdown';

type ImageProps = NextImageProps & {
  caption?: React.ReactNode;
  altText?: React.ReactNode;
};

const Image: React.FC<ImageProps> = ({ caption, altText, ...props }) => {
  if (!caption && !altText) {
    return <NextImage {...props} />;
  }

  return (
    <figure>
      <NextImage {...props} />
      <figcaption className="text-sm text-faded italic text-center mt-1 mb-2">
        {altText ? (
          <details>
            <summary>{caption}</summary>
            {typeof altText === 'string' ? (
              <Markdown className="text-left border border-faded-light mt-2 p-2 max-w-md mx-auto">{altText}</Markdown>
            ) : (
              altText
            )}
          </details>
        ) : (
          caption
        )}
      </figcaption>
    </figure>
  );
};

export default Image;
