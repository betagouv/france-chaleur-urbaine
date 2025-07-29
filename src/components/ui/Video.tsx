import React from 'react';

import Markdown from '@/components/ui/Markdown';

type VideoProps = React.ComponentProps<'iframe'> & {
  caption?: React.ReactNode;
  altText?: React.ReactNode;
  url: string;
};

const Video: React.FC<VideoProps> = ({ url, caption, altText, ...props }) => {
  return (
    <figure>
      <iframe
        className="fr-ratio-16x9"
        width="100%"
        src={url}
        title="YouTube video player"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        {...props}
      />
      {(altText || caption) && (
        <figcaption className="text-sm text-faded italic text-center mb-2 mt-1">
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
      )}
    </figure>
  );
};

export default Video;
