import { MediaVideo } from '@codegouvfr/react-dsfr';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { trackEvent } from 'src/services/analytics';

const TrackedVideo = ({
  height,
  width,
  poster,
  src,
  className,
}: {
  height?: string;
  width?: string;
  poster?: string;
  src: string;
  className?: string;
}) => {
  const router = useRouter();
  const [notified, setNotified] = useState(false);

  const onPlay = () => {
    if (!notified) {
      setNotified(true);
      trackEvent('Vidéo', [src, router.asPath]);
    }
  };

  return (
    <MediaVideo className={className || undefined}>
      <video
        onPlay={onPlay}
        height={height || undefined}
        width={width || undefined}
        controls
        poster={poster}
        src={src}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: needed by DSFR
        href={src}
      />
    </MediaVideo>
  );
};

export default TrackedVideo;
