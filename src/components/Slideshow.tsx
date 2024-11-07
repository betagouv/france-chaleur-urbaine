import { fr } from '@codegouvfr/react-dsfr';
import React, { useState } from 'react';

import cx from '@utils/cx';

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
        alt=""
        className={fr.cx('fr-responsive-img')}
        loading="lazy"
        style={{
          maxHeight: '350px',
          objectFit: 'contain',
        }}
      />

      <nav
        role="navigation"
        className={cx(fr.cx('fr-pagination', 'fr-mt-1w'), { 'fcu-invisible': images.length <= 1 })}
        aria-label="Pagination"
      >
        <ul className={fr.cx('fr-pagination__list')}>
          <li>
            <a
              className={fr.cx('fr-pagination__link')}
              role="link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setVisibleSlideIndex((visibleSlideIndex - 1 + images.length) % images.length);
              }}
            >
              <Icon name="ri-arrow-left-s-line" size="sm" />
              Précédent
            </a>
          </li>
          <li className={fr.cx('fr-col')} aria-hidden />
          <li>
            <a
              className={fr.cx('fr-pagination__link')}
              role="link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setVisibleSlideIndex((visibleSlideIndex + 1) % images.length);
              }}
            >
              Suivant
              <Icon name="ri-arrow-right-s-line" size="sm" />
            </a>
          </li>
        </ul>
      </nav>
    </Box>
  );
};

export default Slideshow;
