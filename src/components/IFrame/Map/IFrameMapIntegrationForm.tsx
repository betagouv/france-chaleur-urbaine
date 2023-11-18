import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { Checkbox, CheckboxGroup } from '@dataesr/react-dsfr';
import React, { useState } from 'react';
import { SuggestionItem } from 'src/types/Suggestions';
import { AddressContainer } from './IFrameParametrization.styles';
import IFrameLink from '../Form/IFrameLink';
import { Coords } from 'src/types/Coords';

const selectableLayers = [
  {
    label: 'Les réseaux de chaleur existants',
    key: 'reseau_chaleur',
  },
  {
    label: 'Les réseaux de chaleur en construction',
    key: 'futur_reseau',
  },
  {
    label: 'Les périmètres de developpement prioritaire',
    key: 'pdp',
  },
  {
    label: 'Les réseaux de froid',
    key: 'reseau_froid',
  },
] as const;

type LayerKey = (typeof selectableLayers)[number]['key'];

const IFrameMapIntegrationForm = () => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<LayerKey[]>([
    'pdp',
    'futur_reseau',
    'reseau_froid',
    'reseau_chaleur',
  ]);

  const url = `legend=true${
    coords ? `&coord=${coords.lon},${coords.lat}&zoom=12` : ''
  }&displayLegend=${selectedLayers.join(',')}`;

  const onAddressSelected = async (
    address: string,
    geoAddress?: SuggestionItem
  ) => {
    if (!geoAddress) {
      setCoords(null);
      return;
    }

    setCoords({
      lon: geoAddress.geometry.coordinates[0],
      lat: geoAddress.geometry.coordinates[1],
    });
  };

  const toggleLayerSelection = (layerName: LayerKey, enable: boolean) => {
    if (enable) {
      setSelectedLayers([...selectedLayers, layerName]);
    } else {
      setSelectedLayers(selectedLayers.filter((layer) => layer !== layerName));
    }
  };

  return (
    <>
      <CheckboxGroup>
        {selectableLayers.map((selectableLayer) => (
          <Checkbox
            key={selectableLayer.key}
            label={selectableLayer.label}
            defaultChecked={true}
            onClick={(e) =>
              toggleLayerSelection(
                selectableLayer.key,
                (e.target as any).checked
              )
            }
          />
        ))}
      </CheckboxGroup>
      <div style={{ fontSize: '18px', color: '#4550E5' }}>
        Vous souhaitez centrer la carte sur un endroit en particulier ?
      </div>
      <AddressContainer>
        <AddressAutocomplete
          onAddressSelected={onAddressSelected}
          popoverClassName={'popover-search-form'}
          placeholder="Tapez ici votre adresse"
        />
      </AddressContainer>
      <IFrameLink
        style={{ color: '#000074', marginTop: '20px', wordBreak: 'break-all' }}
        link={`<iframe title="France chaleur urbaine - Carte" src="https://france-chaleur-urbaine.beta.gouv.fr/map?${url}" width="100%" height="600" />`}
      />
    </>
  );
};

export default IFrameMapIntegrationForm;
