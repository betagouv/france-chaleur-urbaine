import { cva } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

import useQueryFlag from '@/hooks/useQueryFlag';
import { trackEvent } from '@/services/analytics';

import Button from './Button';
import Icon from './Icon';
import Tile, { type TileProps } from './Tile';

export type TileListItem = {
  title: string;
  excerpt?: string;
  href: string;
  image?: string;
  start?: TileProps['start'];
  eventKey?: TileProps['eventKey'];
};

const tileListVariants = cva('grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4');

export type TileListProps = {
  items: TileListItem[];
  initialVisibleCount?: number;
  size?: TileProps['size'];
  orientation?: TileProps['orientation'];
  queryParamName?: string;
  eventKeyExpanded?: TileProps['eventKey'];
  eventKeyCollapsed?: TileProps['eventKey'];
};

/**
 * A list of tiles component with enhanced features:
 * - Initial visible count via `initialVisibleCount` prop
 * - Orientation variants via `orientation` prop (horizontal, vertical)
 * - Query param name to store state in URL via `queryParamName` prop
 */
const TileList: React.FC<TileListProps> = ({
  items,
  initialVisibleCount = 4,
  size = 'sm',
  orientation = 'horizontal',
  queryParamName,
  eventKeyExpanded,
  eventKeyCollapsed,
}) => {
  const [localShowAll, setLocalShowAll] = useState<boolean>(false);
  const [urlShowAll, setUrlShowAll] = useQueryFlag(queryParamName || '');

  const showAll = queryParamName ? urlShowAll : localShowAll;
  const setShowAll = queryParamName ? setUrlShowAll : setLocalShowAll;

  return (
    <section>
      <div className={tileListVariants()}>
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={`${item.title}-${index}`}
              initial={index >= initialVisibleCount ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
              animate={showAll || index < initialVisibleCount ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Tile
                title={item.title}
                desc={item.excerpt}
                start={item.start}
                eventKey={item.eventKey}
                linkProps={{
                  href: item.href,
                  className: 'h-full',
                }}
                image={item.image}
                enlargeLinkOrButton
                imageSvg={false}
                titleAs="h3"
                orientation={orientation}
                size={size}
                className="h-full w-full"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {items.length > initialVisibleCount && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => {
              !showAll ? eventKeyExpanded && trackEvent(eventKeyExpanded) : eventKeyCollapsed && trackEvent(eventKeyCollapsed);
              setShowAll(!showAll);
            }}
            priority="secondary"
          >
            {showAll ? <Icon name="fr-icon-arrow-up-line" /> : <Icon name="fr-icon-arrow-down-line" />}
          </Button>
        </div>
      )}
    </section>
  );
};

export default TileList;
