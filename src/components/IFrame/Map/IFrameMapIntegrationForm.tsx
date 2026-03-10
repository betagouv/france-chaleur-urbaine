import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { type ReactNode, useState } from 'react';

import { type LegendURLKey, selectableLayers } from '@/components/Map/map-layers';
import Notice from '@/components/ui/Notice';
import { AddressSearch } from '@/modules/form/AddressSearch';
import type { Coords } from '@/modules/geo/types';

import { StyledIFrameLink } from './IFrameMapIntegrationForm.styles';

const IFrameMapIntegrationForm = ({ label }: { label?: ReactNode }) => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<LegendURLKey[]>(selectableLayers.map((l) => l.key));

  const url = `legend=true${coords ? `&coord=${coords.lon},${coords.lat}&zoom=12` : ''}&displayLegend=${selectedLayers.join(',')}`;

  const toggleLayerSelection = (layerName: LegendURLKey, enable: boolean) => {
    if (enable) {
      setSelectedLayers([...selectedLayers, layerName]);
    } else {
      setSelectedLayers(selectedLayers.filter((layer) => layer !== layerName));
    }
  };

  return (
    <>
      <Checkbox
        legend=""
        options={selectableLayers.map((selectableLayer) => ({
          label: selectableLayer.label,
          nativeInputProps: {
            defaultChecked: true,
            onClick: (e) => toggleLayerSelection(selectableLayer.key, (e.target as any).checked),
          },
        }))}
      />
      {label ? (
        label
      ) : (
        <Notice variant="info" size="xs">
          Vous souhaitez centrer la carte sur un endroit en particulier ?
        </Notice>
      )}
      <div className="mt-4 max-w-[500px]">
        <AddressSearch
          nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
          onSelect={(item) => setCoords({ lat: item.geometry.coordinates[1], lon: item.geometry.coordinates[0] })}
          onClear={() => setCoords(null)}
        />
      </div>
      <StyledIFrameLink
        className="fr-mt-3w"
        link={`<iframe title="France chaleur urbaine - Carte" src="https://france-chaleur-urbaine.beta.gouv.fr/map?${url}" width="100%" height="600"></iframe>`}
      />
    </>
  );
};

export default IFrameMapIntegrationForm;
