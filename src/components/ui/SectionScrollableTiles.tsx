'use client';

import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { useCallback, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Section, { SectionContent, SectionHeading } from '@/components/ui/Section';
import { trackEvent, type TrackingEvent } from '@/services/analytics';
import cx from '@/utils/cx';

export interface SectionScrollableTilesItem {
  image: string;
  title: string;
  excerpt?: string;
  iconColor?: string;
  href?: string;
  eventKey?: TrackingEvent;
  onClick?: () => void;
}

export type SectionScrollableTilesProps = {
  title: string;
  tiles: SectionScrollableTilesItem[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
} & React.ComponentProps<typeof Section>;

function SectionScrollableTiles({ title, tiles, size = 'md', className, ...props }: SectionScrollableTilesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tileWidth = size === 'sm' ? 120 : size === 'lg' ? 200 : 170;
  const gap = 16;
  const containerWidth = scrollContainerRef.current?.clientWidth || 0;

  const nbVisibleTiles = Math.floor((containerWidth + gap) / (tileWidth + gap));
  const maxIndex = Math.max(0, tiles.length - nbVisibleTiles);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: index * (tileWidth + gap),
          behavior: 'smooth',
        });
      }
    },
    [size]
  );

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  }, [currentIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(maxIndex, currentIndex + 1);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  }, [currentIndex, maxIndex, scrollToIndex]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
      const newIndex = Math.round(scrollLeft / (tileWidth + gap));
      setCurrentIndex(Math.min(maxIndex, Math.max(0, newIndex)));
    },
    [size, maxIndex]
  );

  return (
    <Section size={size} className={cx(className)} {...props}>
      <SectionContent className="!mt-0 !py-0">
        <div className="flex items-center justify-between mb-6">
          <SectionHeading as="h2" size="h2" className="!mb-0">
            {title}
          </SectionHeading>
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              aria-label="Outils précédents"
              iconId="ri-arrow-left-s-line"
            />
            <Button
              size="small"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              aria-label="Outils suivants"
              iconId="ri-arrow-right-s-line"
            />
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className={cx('flex items-stretch gap-2 transition-all duration-300', 'overflow-x-auto scrollbar-hide scroll-smooth')}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={handleScroll}
          >
            <AnimatePresence mode="popLayout">
              {tiles.map((tile, index) => (
                <>
                  <Link
                    key={`${tile.title}-${index}`}
                    className="flex-shrink-0 text-center hover:!bg-gray-50 cursor-pointer rounded-md p-0.5 py-5 flex flex-col gap-2 tracking-tight"
                    style={{ width: `${tileWidth}px`, backgroundImage: 'none' }}
                    href={tile.href ?? '#'}
                    onClick={(e) => {
                      e.preventDefault();

                      tile.onClick?.();

                      if (tile.eventKey) {
                        trackEvent(tile.eventKey as TrackingEvent);
                      }
                    }}
                  >
                    <Image src={tile.image} alt={tile.title} width={64} height={64} className="mx-auto" />
                    <h2 className="text-base font-semibold text-gray-900 mb-0">{tile.title}</h2>
                    <p className="text-sm text-gray-500 mb-0">{tile.excerpt}</p>
                  </Link>
                  {index < tiles.length - 1 && (
                    <div className="flex items-center justify-center">
                      <div className="w-[1px] h-1/2 bg-[#E3E4FD]" />
                    </div>
                  )}
                </>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </SectionContent>
    </Section>
  );
}

export default SectionScrollableTiles;
