import { useState } from 'react';

import { type MapLegendFeature } from '@/components/Map/map-layers';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';

import MapLegendReseaux from './MapLegendReseaux';

interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  legendTitle?: string;
  children?: React.ReactNode;
}

function SimpleMapLegend({ legendTitle, enabledFeatures, children }: SimpleMapLegendProps) {
  const [showAllLayers, setShowAllLayers] = useState(false);

  return (
    <div className="absolute max-w-md top-2 left-2 bg-white overflow-y-auto">
      {children}
      <Accordion label="Afficher/cacher les couches de données" small>
        <MapLegendReseaux
          enabledFeatures={showAllLayers ? undefined : enabledFeatures}
          legendTitle={legendTitle}
          showFilters={false}
          filtersVisible={false}
          setFiltersVisible={() => {}}
          withComptePro={false}
          showHeader={false}
        />

        <div className="p-2">
          <Button size="small" priority="secondary" onClick={() => setShowAllLayers((prev) => !prev)}>
            {showAllLayers ? 'Voir la sélection' : 'Voir toutes les couches'}
          </Button>
        </div>
      </Accordion>
    </div>
  );
}

export default SimpleMapLegend;
