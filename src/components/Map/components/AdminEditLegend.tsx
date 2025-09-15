import { type MapLegendFeature } from '@/components/Map/map-layers';
import Accordion from '@/components/ui/Accordion';

import MapLegendReseaux from './MapLegendReseaux';

interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  legendTitle?: string;
  children?: React.ReactNode;
}

function SimpleMapLegend({ legendTitle, enabledFeatures, children }: SimpleMapLegendProps) {
  return (
    <div className="absolute max-w-md top-2 left-2 bg-white overflow-y-auto">
      {children}
      <Accordion label="Afficher/cacher les couches de données" small>
        <MapLegendReseaux
          enabledFeatures={enabledFeatures}
          legendTitle={legendTitle}
          filtersVisible={false}
          setFiltersVisible={() => {}}
          withComptePro={false}
        />
      </Accordion>
    </div>
  );
}

export default SimpleMapLegend;
