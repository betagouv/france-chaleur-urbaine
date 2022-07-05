import { useEffect, useRef, useState } from 'react';
import { Container, ImageContainer } from './Carrousel.style';
import CarrouselBody from './CarrouselBody';
import CarrouselNav from './CarrouselNav';

type TestimoniesProps = {
  autor: {
    longName?: string;
    role?: string;
    mansion?: string;
    place?: string;
  };
  testimony: string;
};

type CarrouselProps = {
  Testimonies: TestimoniesProps[];
  duration?: number;
  title?: string;
  imgSrc: string;
  imgAlt?: string;
  imgCaption?: string;
};

function Carrousel({
  Testimonies = [],
  duration = 10,
  title = '',
  imgSrc,
  imgAlt = '',
  imgCaption,
}: CarrouselProps) {
  const [selectedPoint, setSelectedPoint] = useState(0);

  const timer = useRef<typeof setTimeout | NodeJS.Timeout | number | null>(
    null
  );

  useEffect(() => {
    const setTimer = () => {
      const showNext = (_selectedPoint: number) => {
        const newSelectedPoint = _selectedPoint + 1;
        if (newSelectedPoint < Testimonies.length) {
          setSelectedPoint(newSelectedPoint);
        } else {
          setSelectedPoint(0);
        }
      };

      if (timer.current && typeof timer.current === 'number')
        clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        showNext(selectedPoint);
      }, duration * 1000);
    };

    setTimer();

    return () => {
      if (timer.current && typeof timer.current === 'number')
        clearTimeout(timer.current);
    };
  }, [Testimonies.length, duration, selectedPoint]);

  return (
    <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
      <ImageContainer className="fr-col-lg-6 fr-col-md-12">
        <figure>
          <img src={imgSrc} alt={imgAlt} />
          {imgCaption && <figcaption>{imgCaption}</figcaption>}
        </figure>
      </ImageContainer>

      <Container className="fr-col-lg-6 fr-col-md-12">
        {title && <h2>{title}</h2>}
        <CarrouselBody selected={selectedPoint}>
          {Testimonies.map(
            ({ testimony, autor: { longName, role, mansion, place } }, key) => (
              <p key={key} className="fr-text--lead">
                "{testimony}" <br />
                <strong className="fr-text--lg">
                  {longName}, {role}, {mansion}, {place}
                </strong>
              </p>
            )
          )}
        </CarrouselBody>
        <CarrouselNav
          duration={duration}
          size={Testimonies.length}
          selectedPoint={selectedPoint}
          onPointSelected={setSelectedPoint}
        />
      </Container>
    </div>
  );
}

export default Carrousel;
