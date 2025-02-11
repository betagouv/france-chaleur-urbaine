import Alert from '@codegouvfr/react-dsfr/Alert';
import { useQueryState } from 'nuqs';
import { useRef, useState } from 'react';
import styled from 'styled-components';

import { ContactForm, SelectEnergy } from '@/components/EligibilityForm/components';
import { energyInputsDefaultLabels } from '@/components/EligibilityForm/EligibilityFormAddress';
import AddressAutocomplete from '@/components/form/dsfr/AddressAutocompleteInput';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import Text from '@/components/ui/Text';
import { type NetworkEligibilityStatus } from '@/server/services/addresseInformation';
import { useServices } from '@/services';
import { formatDataToAirtable, submitToAirtable } from '@/services/airtable';
import { trackEvent } from '@/services/analytics';
import { Airtable } from '@/types/enum/Airtable';
import { type SuggestionItem } from '@/types/Suggestions';
import { type ContactFormInfos, type FormDemandCreation } from '@/types/Summary/Demand';
import { getReadableDistance } from '@/utils/geo';
import { workMinimum } from '@/utils/time';

type FormState = 'idle' | 'loadingEligibility' | 'eligibilitySubmissionError' | 'sendingDemand' | 'demandCreated' | 'demandSubmissionError';

interface EligibilityTestBoxProps {
  networkId: string;
}

/**
 * Formulaire simplifié de test d'adresse + création d'une demande pour un réseau de chaleur.
 */
const EligibilityTestBox = ({ networkId }: EligibilityTestBoxProps) => {
  const { heatNetworkService } = useServices();
  const [defaultAddress, setDefaultAddress] = useQueryState('address');
  const [selectedGeoAddress, setSelectedGeoAddress] = useState<SuggestionItem>();
  const [eligibilityStatus, setEligibilityStatus] = useState<NetworkEligibilityStatus>();
  const [heatingType, setHeatingType] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const resultsBoxRef = useRef<HTMLDivElement | null>(null);

  // appelé au clic sur Tester l'adresse, pour récupérer l'éligibilité et les informations du réseau
  const testAddressEligibility = async (geoAddress: SuggestionItem) => {
    try {
      trackEvent(`Eligibilité|Formulaire de test - Fiche réseau - Envoi`, geoAddress.properties.label);

      setFormState('loadingEligibility');
      const eligibilityStatus = await workMinimum(() => heatNetworkService.getNetworkEligibilityStatus(networkId, geoAddress), 500);
      setFormState('idle');
      setEligibilityStatus(eligibilityStatus);

      trackEvent(
        `Eligibilité|Formulaire de test - Fiche réseau - Adresse ${eligibilityStatus?.isEligible ? 'É' : 'Iné'}ligible`,
        geoAddress.properties.label
      );

      setTimeout(() => {
        resultsBoxRef.current?.scrollIntoView({
          behavior: 'smooth',
        });
      });
    } catch (err) {
      setFormState('eligibilitySubmissionError');
    }
  };

  const onAddressSelected = (geoAddress?: SuggestionItem) => {
    setDefaultAddress(null);
    // beware, this function gets called every time the address changes
    // and we only need the result when the address is complete
    if (!geoAddress) {
      return;
    }
    setSelectedGeoAddress(geoAddress);
    setEligibilityStatus(undefined);
    setHeatingType('');
    testAddressEligibility(geoAddress);
  };

  // appelé quand on soumet le formulaire de contact (dernière étape), on crée la demande côté airtable
  const submitContactForm = async (contactFormInfos: ContactFormInfos) => {
    if (!selectedGeoAddress) {
      return;
    }
    try {
      const addressContext = selectedGeoAddress.properties.context.split(',');
      const demandCreation: FormDemandCreation = {
        // contact
        ...contactFormInfos,
        company: contactFormInfos.structure === 'Tertiaire' ? contactFormInfos.company : '',

        heatingType: heatingType,

        eligibility: eligibilityStatus,

        // adresse
        address: selectedGeoAddress.properties.label,
        coords: {
          lon: selectedGeoAddress.geometry.coordinates[0],
          lat: selectedGeoAddress.geometry.coordinates[1],
        },
        city: selectedGeoAddress.properties.city,
        postcode: selectedGeoAddress.properties.postcode,
        department: (addressContext[1] || '').trim(),
        region: (addressContext[2] || '').trim(),

        networkId,
      };
      setFormState('sendingDemand');
      await submitToAirtable(formatDataToAirtable(demandCreation), Airtable.UTILISATEURS);
      setFormState('demandCreated');
      trackEvent(
        `Eligibilité|Formulaire de contact ${eligibilityStatus?.isEligible ? 'é' : 'iné'}ligible - Fiche réseau - Envoi`,
        selectedGeoAddress?.properties.label
      );

      setTimeout(() => {
        resultsBoxRef.current?.scrollIntoView({
          behavior: 'smooth',
        });
      });
    } catch (err) {
      setFormState('demandSubmissionError');
    }
  };

  return (
    <>
      <Box p="4w" backgroundColor="blue-france-925-125">
        <Text as="div" size="xl" mb="2w" legacyColor="black" display="flex" className="justify-between items-center">
          <span>Testez l'éligibilité d'une adresse pour ce réseau.</span>
          {formState === 'loadingEligibility' && <Loader size="md" />}
        </Text>
        <AddressAutocomplete
          label=""
          nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
          defaultValue={defaultAddress || ''}
          onClear={() => {
            setSelectedGeoAddress(undefined);
          }}
          onSelect={onAddressSelected}
          excludeCities
        />
        <Box display="flex" alignItems="center" justifyContent="end">
          {formState === 'eligibilitySubmissionError' && (
            <Box textColor="#c00">
              Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
            </Box>
          )}
        </Box>
      </Box>

      {selectedGeoAddress && eligibilityStatus && (
        <>
          {/* pas réussi à intégrer ref dans le composant Box, fait planter la page principale */}
          <div ref={resultsBoxRef} />
          <ResultsBox p="4w" border="1px solid #e7e7e7">
            <Box boxShadow={`inset 16px 0 0 0 ${eligibilityStatus.isEligible ? '#3AB54A' : '#FF5655'}`} pl="4w" pt="2w" pb="1w">
              <Box display="flex" gap="16px">
                <img
                  src={eligibilityStatus.isEligible ? '/img/reponses_tests_pouce_haut.webp' : '/img/reponses_tests_pouce_bas.webp'}
                  alt=""
                  className="fr-col--top"
                />
                <Box backgroundColor="#C1C1C1" width="1px" />
                <Text>
                  {!eligibilityStatus.isEligible ? (
                    <>Votre adresse n'est pas située à proximité de ce réseau.</>
                  ) : eligibilityStatus.isVeryEligible ? (
                    <>
                      Votre adresse est <strong>à proximité immédiate</strong> de ce réseau (
                      {getReadableDistance(eligibilityStatus.distance)}
                      ).
                    </>
                  ) : (
                    <>
                      Votre adresse n’est pas à proximité immédiate de ce réseau de chaleur, toutefois le réseau n’est pas très loin (
                      {getReadableDistance(eligibilityStatus.distance)}).
                    </>
                  )}{' '}
                </Text>
              </Box>

              {/* cas spécifique pour le réseau de Paris */}
              {networkId === '7501C' && (
                <Text size="sm" mt="2w">
                  A noter&nbsp;: sur Paris, la puissance souscrite doit être d’au moins {eligibilityStatus.eligibleDistance}&nbsp;kW.
                </Text>
              )}
            </Box>

            {formState === 'demandCreated' ? (
              <Box boxShadow="inset 16px 0 0 0 var(--border-default-blue-france)" pl="4w" py="1w" mt="2w">
                <Text size="lg" fontWeight="bold">
                  Votre demande de contact est bien prise en compte.
                </Text>

                {eligibilityStatus.isEligible && heatingType === 'collectif' && (
                  <Box mt="1w">
                    Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement. Sans
                    attendre,{' '}
                    <Link
                      href="/documentation/guide-france-chaleur-urbaine.pdf"
                      eventKey="Téléchargement|Guide FCU|Confirmation éligibilité"
                      isExternal
                    >
                      téléchargez notre guide pratique
                    </Link>{' '}
                    afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.
                  </Box>
                )}
              </Box>
            ) : (
              <>
                <Heading size="h4" legacyColor="darkerblue" mt="2w">
                  {eligibilityStatus.isEligible
                    ? 'Recevez des informations adaptées à votre bâtiment de la part du gestionnaire du réseau'
                    : 'Contribuez au développement du réseau de chaleur en faisant connaître votre souhait de vous raccorder'}
                </Heading>

                <ContactForm
                  city={selectedGeoAddress?.properties.city}
                  onSubmit={submitContactForm}
                  isLoading={formState === 'sendingDemand'}
                  heatingTypeInput={
                    <>
                      <SelectEnergy
                        label="Mode de chauffage actuel :"
                        name="heatingType"
                        className="fr-mt-2w"
                        selectOptions={energyInputsDefaultLabels}
                        onChange={setHeatingType}
                        value={heatingType}
                      />
                      {heatingType === 'individuel' && (
                        <Alert
                          className="fr-mt-2w"
                          severity="warning"
                          small
                          description="Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble"
                        />
                      )}
                    </>
                  }
                />
                {formState === 'demandSubmissionError' && (
                  <Box textColor="#c00" mt="1w">
                    Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
                  </Box>
                )}
              </>
            )}
          </ResultsBox>
        </>
      )}
    </>
  );
};

export default EligibilityTestBox;

export const ResultsBox = styled(Box)`
  overflow: hidden;
  animation: scrollDown 0.5s ease-out forwards;

  @keyframes scrollDown {
    from {
      max-height: 0;
      opacity: 0;
    }
    to {
      max-height: 1600px; // needs to be greater than the height of the box
      opacity: 1;
    }
  }
`;
