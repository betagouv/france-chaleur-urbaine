import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { Checkbox, CheckboxGroup } from '@dataesr/react-dsfr';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { SuggestionItem } from 'src/types/Suggestions';
import {
  AddressContainer,
  Container,
  IFrame,
} from './IFrameParametrization.styles';
import IFrameLink from '../Form/IFrameLink';

const IFrameParametrization = () => {
  const [coords, setCoords] = useState<{ lon: number; lat: number } | null>(
    null
  );
  const [selectedInfo, setSelectedInfo] = useState<string[]>([
    'pdp',
    'futur_reseau',
    'reseau_froid',
    'reseau_chaleur',
  ]);

  const url = useMemo(() => {
    let result = 'legend=true';
    if (coords) {
      result += `&coord=${coords.lon},${coords.lat}&zoom=12`;
    }

    result += `&displayLegend=${selectedInfo.join(',')}`;

    return result;
  }, [coords, selectedInfo]);

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

  const onCheckBoxClick = (
    event: ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    if (event.target.checked) {
      setSelectedInfo([...selectedInfo, name]);
    } else {
      setSelectedInfo(selectedInfo.filter((info) => info !== name));
    }
  };

  return (
    <Container>
      <h4>Intégrez notre cartographie à votre site</h4>
      Il vous suffit de sélectionner les informations que vous voulez afficher
      et de copier les lignes de code obtenues dans le code source de votre
      site.
      <br />
      <br />
      <CheckboxGroup legend="Vous voulez afficher:">
        <Checkbox
          label="Les réseaux de chaleur existants"
          defaultChecked={true}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          onClick={(e) => onCheckBoxClick(e, 'reseau_chaleur')}
        />
        <Checkbox
          label="Les réseaux de chaleur en construction"
          defaultChecked={true}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          onClick={(e) => onCheckBoxClick(e, 'futur_reseau')}
        />
        <Checkbox
          label="Les périmètres de developpement prioritaire"
          defaultChecked={true}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          onClick={(e) => onCheckBoxClick(e, 'pdp')}
        />
        <Checkbox
          label="Les réseaux de froid"
          defaultChecked={true}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          onClick={(e) => onCheckBoxClick(e, 'reseau_froid')}
        />
      </CheckboxGroup>
      <div>Vous souhaitez centrer la carte sur un endroit en particulier ?</div>
      <AddressContainer>
        <AddressAutocomplete
          onAddressSelected={onAddressSelected}
          popoverClassName={'popover-search-form'}
        />
      </AddressContainer>
      <br />
      <IFrame>
        <IFrameLink
          link={`
<iframe
width="100%"
title="France chaleur urbaine - Carte"
src="https://france-chaleur-urbaine.beta.gouv.fr/map?${url}"
/>
`}
        />
      </IFrame>
      <br />
      Pensez à ajuster les valeurs des variables "width" et "height" pour
      obtenir un affichage optimal sur votre site. Vous pouvez par ailleurs
      ajuster le niveau de zoom souhaité dans le lien (entre 1 et 17).
      <br />
      <br />
      <div>
        <b>
          Si vous souhaitez une carte personnalisée avec seulement vos réseaux,
          votre logo ou d'autres informations, n'hésitez pas à{' '}
          <a
            href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            nous contacter
          </a>
        </b>
      </div>
    </Container>
  );
};

export default IFrameParametrization;
