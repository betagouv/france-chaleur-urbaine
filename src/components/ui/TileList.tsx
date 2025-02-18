import { cva } from 'class-variance-authority';
import React, { useState } from 'react';

import useQueryFlag from '@/hooks/useQueryFlag';

import Button from './Button';
import Icon from './Icon';
import Tile, { type TileProps } from './Tile';

export type TileListItem = {
  title: string;
  excerpt?: string;
  href: string;
  image?: string;
};

const tileListVariants = cva('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4');

export type TileListProps = {
  items: TileListItem[];
  initialVisibleCount?: number;
  size?: TileProps['size'];
  orientation?: TileProps['orientation'];
  queryParamName?: string;
};

/**
 * A list of tiles component with enhanced features:
 * - Initial visible count via `initialVisibleCount` prop
 * - Orientation variants via `orientation` prop (horizontal, vertical)
 * - Query param name to store state in URL via `queryParamName` prop
 */
const TileList: React.FC<TileListProps> = ({ items, initialVisibleCount = 4, size = 'sm', orientation = 'horizontal', queryParamName }) => {
  const [localShowAll, setLocalShowAll] = useState<boolean>(false);
  const [urlShowAll, setUrlShowAll] = useQueryFlag(queryParamName || '');

  const showAll = queryParamName ? urlShowAll : localShowAll;
  const setShowAll = queryParamName ? setUrlShowAll : setLocalShowAll;

  const visibleItems = showAll ? items : items.slice(0, initialVisibleCount);

  return (
    <section>
      <div className={tileListVariants()}>
        {visibleItems.map((item, index) => (
          <Tile
            key={`${item.title}-${index}`}
            title={item.title}
            desc={item.excerpt}
            linkProps={{
              href: item.href,
            }}
            image={item.image}
            enlargeLinkOrButton
            imageSvg={false}
            titleAs="h3"
            orientation={orientation}
            size={size}
          />
        ))}
      </div>
      {items.length > initialVisibleCount && (
        <div className="flex justify-center mt-6">
          <Button onClick={() => setShowAll(!showAll)} priority="secondary">
            {showAll ? <Icon name="fr-icon-arrow-up-line" /> : <Icon name="fr-icon-arrow-down-line" />}
          </Button>
        </div>
      )}
    </section>
  );
};

export default TileList;
