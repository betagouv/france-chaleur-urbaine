import { fr } from '@codegouvfr/react-dsfr';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';

import Box from './ui/Box';
import Icon from './ui/Icon';

export interface SlideshowProps {
  images: string[];
}

/**
 * Displays basic slideshow of images.
 */
const Slideshow = ({ images }: SlideshowProps) => {
  const [visibleSlideIndex, setVisibleSlideIndex] = useState(0);

  return (
    <Box display="flex" flexDirection="column">
      <img
        src={images[visibleSlideIndex]}
        alt={`Diapositive ${visibleSlideIndex + 1} sur ${images.length}`}
        className={fr.cx('fr-responsive-img')}
        loading="lazy"
        style={{
          maxHeight: '350px',
          objectFit: 'contain',
        }}
      />

      <nav className={cx(fr.cx('fr-pagination', 'fr-mt-1w'), { invisible: images.length <= 1 })} aria-label="Pagination">
        <ul className={fr.cx('fr-pagination__list')}>
          <li>
            <Button
              priority="tertiary no outline"
              className={fr.cx('fr-pagination__link')}
              onClick={(e) => {
                e.preventDefault();
                setVisibleSlideIndex((visibleSlideIndex - 1 + images.length) % images.length);
              }}
            >
              <Icon name="ri-arrow-left-s-line" size="sm" />
              Précédent
            </Button>
          </li>
          <li className={fr.cx('fr-col')} aria-hidden />
          <li>
            <Button
              priority="tertiary no outline"
              className={fr.cx('fr-pagination__link')}
              onClick={(e) => {
                e.preventDefault();
                setVisibleSlideIndex((visibleSlideIndex + 1) % images.length);
              }}
            >
              Suivant
              <Icon name="ri-arrow-right-s-line" size="sm" />
            </Button>
          </li>
        </ul>
      </nav>
    </Box>
  );
};

export default Slideshow;
