import React, { useState } from 'react';

import Icon from '@/components/ui/Icon';
import Video from '@/components/ui/Video';

const videos = [
  {
    url: 'https://www.youtube.com/embed/zsOgW8sIByc',
    caption: 'Bande annonce de la série "Les ambassadeurs du chauffage urbain"',
  },
  { url: 'https://www.youtube.com/embed/iv0gb71XOj4', caption: 'Les ambassadeurs du chauffage urbain 1/6' },
  { url: 'https://www.youtube.com/embed/wtNmhwa5_DA', caption: 'Les ambassadeurs du chauffage urbain 2/6' },
  { url: 'https://www.youtube.com/embed/2mO97aF1T4c', caption: 'Les ambassadeurs du chauffage urbain 3/6' },
  { url: 'https://www.youtube.com/embed/wieL5MpMtnE', caption: 'Les ambassadeurs du chauffage urbain 4/6' },
  { url: 'https://www.youtube.com/embed/eDnhC9l5pWI', caption: 'Les ambassadeurs du chauffage urbain 5/6' },
  { url: 'https://www.youtube.com/embed/c2Qgctn9SVY?cc_load_policy=1', caption: 'Les ambassadeurs du chauffage urbain 6/6' },
];

const InterviewsVideos = () => {
  const [videoIndex, setVideoIndex] = useState(0);
  const video = videos[videoIndex];

  return (
    <>
      <Video {...video} altText={`Le transcript de cette vidéo est disponible sur YouTube.`} />

      <nav role="navigation" className="fr-pagination" aria-label="Pagination">
        <ul className="fr-pagination__list">
          <li>
            <a
              className="fr-pagination__link"
              role="link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setVideoIndex((videoIndex - 1 + videos.length) % videos.length);
              }}
            >
              <Icon name="ri-arrow-left-s-line" size="sm" />
              Précédent
            </a>
          </li>
          <li className="fr-col" aria-hidden />
          <li>
            <a
              className="fr-pagination__link"
              role="link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setVideoIndex((videoIndex + 1) % videos.length);
              }}
            >
              Suivant
              <Icon name="ri-arrow-right-s-line" size="sm" />
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default InterviewsVideos;
