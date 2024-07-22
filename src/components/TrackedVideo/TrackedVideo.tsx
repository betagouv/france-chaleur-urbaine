import Box from '@components/ui/Box';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { trackEvent } from 'src/services/analytics';

const TrackedVideo = ({
  height,
  width,
  poster,
  src,
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
    <Box className="fr-content-media">
      <Box className="fr-responsive-vid">
        <video
          onPlay={onPlay}
          height={height}
          width={width}
          controls
          poster={poster}
          src={src}
        />
      </Box>
    </Box>
  );
};

export default TrackedVideo;
