import AddressAutocomplete from '@components/addressAutocomplete';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import { Button } from '@dataesr/react-dsfr';
import { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { getReadableDistance } from 'src/services/Map/distance';
import { FullHeatNetworksResponse } from 'src/types/HeatNetworksResponse';
import { SuggestionItem } from 'src/types/Suggestions';

interface EligibilityTestBoxProps {
  networkId: string;
}

/**
 * Formulaire de test d'adresse + création d'une demande pour un réseau de chaleur.
 *
 * Etats :
 * - test d'adresse à remplir
 * - avec résultat d'éligibilité
 * - avec formulaire soumi
 */
const EligibilityTestBox = ({ networkId }: EligibilityTestBoxProps) => {
  const { heatNetworkService } = useServices();

  const [selectedGeoAddress, setSelectedGeoAddress] =
    useState<SuggestionItem>();

  const [eligibilityStatus, setEligibilityStatus] =
    useState<FullHeatNetworksResponse>();

  const onAddressSelected = useCallback(
    async (address: string, geoAddress?: SuggestionItem) => {
      // beware, this function gets called every time the address changes
      // and we only need the result when the address is complete
      if (!geoAddress) {
        return;
      }
      console.log('onAddressSelected', address, geoAddress);
      setSelectedGeoAddress(geoAddress);
    },
    [setSelectedGeoAddress]
  );

  const testAddressEligibility = async (geoAddress: SuggestionItem) => {
    const eligibilityStatus =
      await heatNetworkService.getNetworkEligibilityStatus(
        networkId,
        geoAddress
      );
    console.log('eligibilityStatus', eligibilityStatus);
    setEligibilityStatus(eligibilityStatus);
  };

  // DEBUG
  useEffect(() => {
    setTimeout(() => {
      testAddressEligibility({
        type: 'Feature',
        geometry: {
          type: 'Point',
          // coordinates: [2.355451, 48.840928], // eligible 5m
          // coordinates: [2.355451, 48.846928], // not eligible close 195m
          coordinates: [2.355451, 48.849928], // not eligible far 206m
        },
        properties: {
          label: '5 Rue Censier 75005 Paris',
          score: 0.8807772727272727,
          housenumber: '5',
          id: '75105_1642_00005',
          name: '5 Rue Censier',
          postcode: '75005',
          citycode: '75105',
          x: 652693.33,
          y: 6860290.73,
          city: 'Paris',
          district: 'Paris 5e Arrondissement',
          context: '75, Paris, Île-de-France',
          type: 'housenumber',
          importance: 0.68855,
          street: 'Rue Censier',
        },
      });
    }, 500);
  }, []);

  return (
    <>
      <Box p="4w" backgroundColor="blue-france-925-125">
        <Text size="xl" mb="2w" legacyColor="black">
          Testez l'éligibilité d'une adresse pour ce réseau. {networkId}
        </Text>

        <AddressAutocomplete
          placeholder="Tapez ici votre adresse"
          onAddressSelected={onAddressSelected}
        />
        <Button
          onClick={() =>
            testAddressEligibility(selectedGeoAddress as SuggestionItem)
          }
          disabled={!selectedGeoAddress}
        >
          Tester
        </Button>
      </Box>

      {eligibilityStatus && (
        <Box p="4w" border="1px solid #e7e7e7">
          <Box
            p="4w"
            boxShadow={`inset 16px 0 0 0 ${
              eligibilityStatus.isEligible ? '#78EB7B' : '#ea7c3f'
            }`}
          >
            <Box display="flex" gap="16px">
              <img
                src="/img/reponses_tests_pouce_haut.webp"
                alt=""
                className="fr-col--top"
              />
              <Box backgroundColor="#C1C1C1" width="1px" />
              <Text>
                {eligibilityStatus.distance < 100 ? (
                  <>
                    Votre adresse est <strong>à proximité immédiate</strong> de
                    ce réseau
                  </>
                ) : eligibilityStatus.distance < 200 ? (
                  <>
                    Votre adresse n’est pas à proximité immédiate de ce réseau
                    de chaleur, toutefois le réseau n’est pas très loin
                  </>
                ) : (
                  <>Votre adresse n'est pas située à proximité de ce réseau.</>
                )}{' '}
                ({getReadableDistance(eligibilityStatus.distance)}).
              </Text>
            </Box>
          </Box>
          <Heading size="h4" legacyColor="darkerblue" mt="2w">
            Recevez plus d’informations adaptées à votre bâtiment de la part du
            gestionnaire du réseau
          </Heading>
          TODO formulaire
        </Box>
      )}
    </>
  );
};

export default EligibilityTestBox;
