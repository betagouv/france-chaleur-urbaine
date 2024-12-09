import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { type ReactNode, useState } from 'react';

import AddressAutocomplete from '@/components/addressAutocomplete/AddressAutocomplete';
import { type LegendURLKey, selectableLayers } from '@/components/Map/map-layers';
import { type Coords } from '@/types/Coords';
import { type SuggestionItem } from '@/types/Suggestions';

import { AddressContainer, DivQuestionCenterMap, StyledIFrameLink } from './IFrameMapIntegrationForm.styles';

const IFrameMapIntegrationForm = ({ label }: { label?: ReactNode }) => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<LegendURLKey[]>(selectableLayers.map((l) => l.key));

  const url = `legend=true${coords ? `&coord=${coords.lon},${coords.lat}&zoom=12` : ''}&displayLegend=${selectedLayers.join(',')}`;

  const onAddressSelected = async (address: string, geoAddress?: SuggestionItem) => {
    if (!geoAddress) {
      setCoords(null);
      return;
    }

    setCoords({
      lon: geoAddress.geometry.coordinates[0],
      lat: geoAddress.geometry.coordinates[1],
    });
  };

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
      {label ? label : <DivQuestionCenterMap>Vous souhaitez centrer la carte sur un endroit en particulier ?</DivQuestionCenterMap>}
      <AddressContainer>
        <AddressAutocomplete onAddressSelected={onAddressSelected} placeholder="Tapez ici votre adresse" />
      </AddressContainer>
      <StyledIFrameLink
        className="fr-mt-3w"
        link={`<iframe title="France chaleur urbaine - Carte" src="https://france-chaleur-urbaine.beta.gouv.fr/map?${url}" width="100%" height="600" />`}
      />
    </>
  );
};

export default IFrameMapIntegrationForm;
