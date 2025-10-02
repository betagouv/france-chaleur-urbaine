import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Video from '@/components/ui/Video';

const videos = [
  {
    caption: 'Bande annonce de la série "Les ambassadeurs du chauffage urbain"',
    url: 'https://www.youtube.com/embed/zsOgW8sIByc',
  },
  { caption: 'Les ambassadeurs du chauffage urbain 1/6', url: 'https://www.youtube.com/embed/iv0gb71XOj4' },
  { caption: 'Les ambassadeurs du chauffage urbain 2/6', url: 'https://www.youtube.com/embed/wtNmhwa5_DA' },
  { caption: 'Les ambassadeurs du chauffage urbain 3/6', url: 'https://www.youtube.com/embed/2mO97aF1T4c' },
  { caption: 'Les ambassadeurs du chauffage urbain 4/6', url: 'https://www.youtube.com/embed/wieL5MpMtnE' },
  { caption: 'Les ambassadeurs du chauffage urbain 5/6', url: 'https://www.youtube.com/embed/eDnhC9l5pWI' },
  { caption: 'Les ambassadeurs du chauffage urbain 6/6', url: 'https://www.youtube.com/embed/c2Qgctn9SVY?cc_load_policy=1' },
];

const InterviewsVideos = () => {
  const [videoIndex, setVideoIndex] = useState(0);
  const video = videos[videoIndex];

  return (
    <>
      <Video {...video} altText={`Le transcript de cette vidéo est disponible sur YouTube.`} />

      <nav className="fr-pagination" aria-label="Pagination">
        <ul className="fr-pagination__list">
          <li>
            <Button
              priority="tertiary no outline"
              className="fr-pagination__link"
              onClick={(e) => {
                e.preventDefault();
                setVideoIndex((videoIndex - 1 + videos.length) % videos.length);
              }}
            >
              <Icon name="ri-arrow-left-s-line" size="sm" />
              Précédent
            </Button>
          </li>
          <li className="fr-col" aria-hidden />
          <li>
            <Button
              priority="tertiary no outline"
              className="fr-pagination__link"
              onClick={(e) => {
                e.preventDefault();
                setVideoIndex((videoIndex + 1) % videos.length);
              }}
            >
              Suivant
              <Icon name="ri-arrow-right-s-line" size="sm" />
            </Button>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default InterviewsVideos;
