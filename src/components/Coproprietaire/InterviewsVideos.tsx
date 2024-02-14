import React, { useState } from 'react';
import { Icon } from '@dataesr/react-dsfr';

const videos = [
  'https://www.youtube.com/embed/zsOgW8sIByc',
  'https://www.youtube.com/embed/iv0gb71XOj4',
  'https://www.youtube.com/embed/wtNmhwa5_DA',
  'https://www.youtube.com/embed/2mO97aF1T4c',
  'https://www.youtube.com/embed/wieL5MpMtnE',
  'https://www.youtube.com/embed/eDnhC9l5pWI',
];

const InterviewsVideos = () => {
  const [videoIndex, setVideoIndex] = useState(0);

  return (
    <>
      <iframe
        className="fr-ratio-16x9"
        width="100%"
        src={videos[videoIndex]}
        title="YouTube video player"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />

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
              <Icon name="ri-arrow-left-s-line" />
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
              <Icon name="ri-arrow-right-s-line" />
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default InterviewsVideos;
