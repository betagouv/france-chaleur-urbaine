import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import { Checkbox, CheckboxGroup } from '@dataesr/react-dsfr';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { SuggestionItem } from 'src/types/Suggestions';
import {
  AddressContainer,
  Container,
  IFrameBox,
} from './IFrameParametrization.styles';
import IFrameLink from '../Form/IFrameLink';
import { LegendURLKey, legendURLKeys } from '@pages/map';
import Text from '@components/ui/Text';
import Link from '@components/ui/Link';

const IFrameParametrization = () => {
  const [coords, setCoords] = useState<{ lon: number; lat: number } | null>(
    null
  );
  const [selectedInfo, setSelectedInfo] = useState<LegendURLKey[]>([
    ...legendURLKeys,
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
    name: LegendURLKey
  ) => {
    if (event.target.checked) {
      setSelectedInfo([...selectedInfo, name]);
    } else {
      setSelectedInfo(selectedInfo.filter((info) => info !== name));
    }
  };

  return (
    <Container>
      <Text size="lg" mb="4w">
        Sélectionnez les informations que vous voulez afficher puis copier les
        lignes de code obtenues :
      </Text>
      <CheckboxGroup>
        <Checkbox
          label="Les réseaux de chaleur existants"
          defaultChecked={true}
          onClick={(e) => onCheckBoxClick(e as any, 'reseau_chaleur')}
        />
        <Checkbox
          label="Les réseaux de chaleur en construction"
          defaultChecked={true}
          onClick={(e) => onCheckBoxClick(e as any, 'futur_reseau')}
        />
        <Checkbox
          label="Les périmètres de développement prioritaire"
          defaultChecked={true}
          onClick={(e) => onCheckBoxClick(e as any, 'pdp')}
        />
        <Checkbox
          label="Les réseaux de froid"
          defaultChecked={true}
          onClick={(e) => onCheckBoxClick(e as any, 'reseau_froid')}
        />
      </CheckboxGroup>
      <Text size="lg" my="2w">
        Vous souhaitez centrer la carte sur un endroit en particulier ?
      </Text>
      <AddressContainer>
        <AddressAutocomplete
          onAddressSelected={onAddressSelected}
          popoverClassName={'popover-search-form'}
        />
      </AddressContainer>
      <br />
      <IFrameBox>
        <IFrameLink
          link={`
<iframe
width="100%"
title="France chaleur urbaine - Carte"
src="https://france-chaleur-urbaine.beta.gouv.fr/map?${url}"
/>
`}
        />
      </IFrameBox>
      <Text size="sm" mt="2w" legacyColor="darkerblue">
        Ajustez les valeurs des variables "width" et "height" pour obtenir un
        affichage optimal sur votre site.
      </Text>
      <Text size="sm" mb="2w" legacyColor="darkerblue">
        Si vous souhaitez une carte personnalisée avec uniquement vos réseaux,
        votre logo ou d'autres informations, n'hésitez pas à{' '}
        <Link
          href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
          isExternal
        >
          nous contacter
        </Link>
      </Text>
    </Container>
  );
};

export default IFrameParametrization;
