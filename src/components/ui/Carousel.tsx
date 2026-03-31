import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';

type CarouselProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T) => ReactNode;
  previousLabel: string;
  nextLabel: string;
};

const SCROLL_TOLERANCE = 4;

function getScrollStep(container: HTMLDivElement) {
  const firstCard = container.querySelector<HTMLElement>('[data-carousel-card]');
  if (!firstCard) {
    return 0;
  }

  const computedStyle = window.getComputedStyle(container);
  const gap = Number.parseFloat(computedStyle.columnGap || computedStyle.gap || '0');
  return firstCard.getBoundingClientRect().width + gap;
}

function Carousel<T>({ items, getItemKey, renderItem, previousLabel, nextLabel }: CarouselProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(items.length > 1);

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(container.scrollLeft > SCROLL_TOLERANCE);
    setCanScrollRight(container.scrollLeft < maxScrollLeft - SCROLL_TOLERANCE);
  };

  const scrollByStep = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scrollStep = getScrollStep(container);
    if (!scrollStep) {
      return;
    }

    container.scrollBy({
      behavior: 'smooth',
      left: direction === 'left' ? -scrollStep : scrollStep,
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons, { passive: true });

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
    };
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fr-mt-4w flex items-center gap-2 md:gap-4">
      <Button
        priority="secondary"
        iconId="fr-icon-arrow-left-s-line"
        title={previousLabel}
        aria-label={previousLabel}
        className={cx('shrink-0', !canScrollLeft && 'invisible')}
        onClick={() => scrollByStep('left')}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <div
              key={getItemKey(item, index)}
              data-carousel-card
              className="w-full shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
      <Button
        priority="secondary"
        iconId="fr-icon-arrow-right-s-line"
        title={nextLabel}
        aria-label={nextLabel}
        className={cx('shrink-0', !canScrollRight && 'invisible')}
        onClick={() => scrollByStep('right')}
      />
    </div>
  );
}

export default Carousel;
