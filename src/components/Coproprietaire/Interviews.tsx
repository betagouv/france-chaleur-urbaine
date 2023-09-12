import React, { useState } from 'react';
import {
  Logo,
  Container,
  Quote,
  Author,
  Icon,
  VideoIndex,
  VideoIndexes,
} from './Interviews.styles';

const videos = [
  'https://www.youtube.com/embed/zsOgW8sIByc',
  'https://www.youtube.com/embed/iv0gb71XOj4',
  'https://www.youtube.com/embed/wtNmhwa5_DA',
  'https://www.youtube.com/embed/2mO97aF1T4c',
  'https://www.youtube.com/embed/wieL5MpMtnE',
  'https://www.youtube.com/embed/eDnhC9l5pWI',
];

const Interviews = () => {
  const [videoIndex, setVideoIndex] = useState(0);

  return (
    <>
      <Logo>
        <img
          src="/img/ambassadeurs.png"
          alt="Logo représantant les ambassadeurs du chauffage urbains"
        />
      </Logo>
      <Container className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-6">
          <h3>
            Le chauffage urbain, <b>ce sont eux qui en parlent le mieux !</b>
          </h3>
          <p>
            Qu’ils soient présidents de conseils syndicaux, syndic ou élus, ils
            expliquent leur choix des réseaux de chaleur. Profitez de ces
            témoignages sur le terrain pour découvrir les atouts du chauffage
            urbain !
          </p>
          <Icon className="fr-icon-quote-line" />
          <Quote>
            “Je conseille vivement le raccordement à un réseau de chaleur pour
            des raisons économiques et écologiques.”
          </Quote>
          <Author>
            <b>
              Henry Hostein
              <br />
              Président de conseil syndical
            </b>
          </Author>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <iframe
            width="100%"
            src={videos[videoIndex]}
            title="YouTube video player"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
          <VideoIndexes>
            {Array.from({ length: 6 }, (value, index) => (
              <VideoIndex
                key={index}
                active={index === videoIndex}
                onClick={() => setVideoIndex(index)}
              />
            ))}
          </VideoIndexes>
        </div>
      </Container>
    </>
  );
};

export default Interviews;
