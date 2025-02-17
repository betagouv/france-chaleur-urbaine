import { cva } from 'class-variance-authority';
import { useQueryState } from 'nuqs';
import React, { useState } from 'react';

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

const TileList: React.FC<TileListProps> = ({ items, initialVisibleCount = 4, size = 'sm', orientation = 'horizontal', queryParamName }) => {
  const [localShowAll, setLocalShowAll] = useState<true | null>(null);
  const [urlShowAll, setUrlShowAll] = useQueryState(queryParamName || '', {
    defaultValue: false,
    parse: (value) => value === 'true',
  });

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
          <Button onClick={() => setShowAll(showAll ? null : true)} priority="secondary">
            {showAll ? <Icon name="fr-icon-arrow-up-line" /> : <Icon name="fr-icon-arrow-down-line" />}
          </Button>
        </div>
      )}
    </section>
  );
};

export default TileList;
