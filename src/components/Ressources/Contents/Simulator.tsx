import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Input from '@codegouvfr/react-dsfr/Input';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';

import { addresseToPublicodesRules } from '@/components/ComparateurPublicodes/mappings';
import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import type { LegacyColor } from '@/components/ui/helpers/colors';
import Text from '@/components/ui/Text';
import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField } from '@/modules/form/AddressField';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { postFetchJSON } from '@/utils/network';
import { ObjectEntries } from '@/utils/typescript';

import { Container, Disclaimer, Form, Inputs, RedirectionButton, Result, ResultValue, Title } from './Simulator.styles';

const TOTAL_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . Total' as RuleName;
const TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . Total montant' as RuleName;
const BOOSTED_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . Coup de pouce' as RuleName;
const STANDARD_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . CEE' as RuleName;
const RESIDENTIAL_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . BAR-TH-137' as RuleName;
const TERTIARY_HEAT_NETWORK_AID_RULE = 'Calcul Eco . Montant des aides . Réseaux de chaleur . BAT-TH-127' as RuleName;
const CEE_VALUE_RULE = 'Paramètres économiques . Aides . Valeur CEE' as RuleName;

const tertiarySectorOptions = [
  { label: 'Bureaux', value: 'Bureaux' },
  { label: 'Enseignement', value: 'Enseignement' },
  { label: 'Commerces', value: 'Commerces' },
  { label: 'Café, restaurant', value: 'Café, restaurant' },
  { label: 'Hôtel', value: 'Hôtel' },
  { label: 'Santé', value: 'Santé' },
  { label: 'Autres', value: 'Autres' },
];

type Structure = 'Résidentiel' | 'Tertiaire';
type TertiarySector = (typeof tertiarySectorOptions)[number]['value'];
type HotWaterProduction = 'oui' | 'non';
type EligibleAid = {
  label: string;
  noteUrl?: string;
};

const Simulator = ({
  cartridge,
  withMargin,
  withRedirection,
  children,
  defaultStructure,
  withTitle,
  backgroundColor,
  formBackgroundColor,
  disclaimerLegacyColor,
  resultColor,
  resultBackgroundColor,
}: {
  cartridge?: boolean;
  withMargin?: boolean;
  withRedirection?: boolean;
  children?: ReactNode;
  defaultStructure?: string;
  withTitle?: boolean;
  backgroundColor?: string;
  formBackgroundColor?: string;
  disclaimerLegacyColor?: LegacyColor;
  resultColor?: string;
  resultBackgroundColor?: string;
}) => {
  const engine = useSimulatorEngine();
  const [structure, setStructure] = useState<Structure>((defaultStructure as Structure) || 'Résidentiel');
  const [value, setValue] = useState('');
  const [address, setAddress] = useState('');
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isEfficientNetwork, setIsEfficientNetwork] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<BANAddressFeature | null>(null);
  const [tertiarySector, setTertiarySector] = useState<TertiarySector>('Bureaux');
  const [producesHotWater, setProducesHotWater] = useState<HotWaterProduction>('oui');
  const [eligibilityError, setEligibilityError] = useState(false);
  const [ceeValue, setCeeValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [structure]);

  const intValue = parseInt(value, 10);

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    engine.setSituation({
      ...engine.getSituation(),
      'méthode tertiaire': structure === 'Tertiaire' ? `'${tertiarySector}'` : null,
      "nombre de logements dans l'immeuble concerné": structure === 'Résidentiel' && intValue > 0 ? intValue : null,
      'Production eau chaude sanitaire': structure === 'Tertiaire' ? producesHotWater : 'oui',
      'surface logement type tertiaire': structure === 'Tertiaire' && intValue > 0 ? intValue : null,
      'type de bâtiment': `'${structure.toLowerCase()}'`,
    });
  }, [engine.loaded, intValue, producesHotWater, structure, tertiarySector]);

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    const parsedCeeValue = ceeValue === '' ? null : Number(ceeValue);

    engine.setSituation({
      ...engine.getSituation(),
      [CEE_VALUE_RULE]: parsedCeeValue !== null && Number.isFinite(parsedCeeValue) ? parsedCeeValue : null,
    });
  }, [ceeValue, engine.loaded]);

  const helpCumac = selectedAddress && intValue > 0 ? engine.getFieldAsNumber(TOTAL_HEAT_NETWORK_AID_RULE) : 0;
  const helpAmount = selectedAddress && intValue > 0 ? engine.getFieldAsNumber(TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE) : 0;
  const boostedHelp = selectedAddress && intValue > 0 ? engine.getFieldAsNumber(BOOSTED_HEAT_NETWORK_AID_RULE) : 0;
  const standardHelp = selectedAddress && intValue > 0 ? engine.getFieldAsNumber(STANDARD_HEAT_NETWORK_AID_RULE) : 0;
  const currentCeeValue = engine.loaded ? engine.getFieldAsNumber(CEE_VALUE_RULE) : 0;

  const getRuleNoteUrl = (ruleName: RuleName) => {
    const note = engine.getRule(ruleName)?.rawNode.note;
    return typeof note === 'string' && note.startsWith('http') ? note : undefined;
  };

  const eligibleAid: EligibleAid | null =
    helpCumac > 0 && boostedHelp === helpCumac
      ? {
          label: 'Coup de pouce',
          noteUrl: getRuleNoteUrl(BOOSTED_HEAT_NETWORK_AID_RULE),
        }
      : helpCumac > 0 && standardHelp === helpCumac
        ? {
            label: structure === 'Résidentiel' ? 'BAR-TH-137' : 'BAT-TH-127',
            noteUrl: getRuleNoteUrl(structure === 'Résidentiel' ? RESIDENTIAL_HEAT_NETWORK_AID_RULE : TERTIARY_HEAT_NETWORK_AID_RULE),
          }
        : null;

  const clearAddressSituation = () => {
    const clearedSituation: Partial<Record<RuleName, any>> = { ...engine.getSituation() };
    engine.setSituation(
      ObjectEntries(addresseToPublicodesRules).reduce((acc, [key]) => {
        acc[key] = null;
        return acc;
      }, clearedSituation)
    );
  };

  const handleAddressSelected = async (geoAddress?: BANAddressFeature) => {
    if (!geoAddress) {
      return;
    }

    setAddress(geoAddress.properties.label);
    setSelectedAddress(geoAddress);

    try {
      setEligibilityError(false);
      const [lon, lat] = geoAddress.geometry.coordinates;
      const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
        city: geoAddress.properties.city,
        cityCode: geoAddress.properties.citycode,
        lat,
        lon,
      });

      if (!infos.infosVille) {
        setNetworkName(null);
        setIsEfficientNetwork(false);
        setEligibilityError(true);
        return;
      }

      setNetworkName(infos.nearestReseauDeChaleur?.nom_reseau ?? null);
      setIsEfficientNetwork((infos.nearestReseauDeChaleur?.['Taux EnR&R'] ?? 0) > 50);

      const addressSituation: Partial<Record<RuleName, any>> = { ...engine.getSituation() };
      engine.setSituation(
        ObjectEntries(addresseToPublicodesRules).reduce((acc, [key, infoGetter]) => {
          acc[key] = infoGetter(infos) ?? null;
          return acc;
        }, addressSituation)
      );
    } catch (error) {
      setNetworkName(null);
      setIsEfficientNetwork(false);
      setEligibilityError(true);
      console.error('Simulator eligibility error', error);
    }
  };

  return (
    <Container withMargin={withMargin} cartridge={cartridge} withRedirection={withRedirection} backgroundColor={backgroundColor}>
      {withTitle && (
        <Title>
          Estimer le montant du Coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires » pour le raccordement de mon
          bâtiment
        </Title>
      )}
      <Form cartridge={cartridge}>
        <Inputs cartridge={cartridge} backgroundColor={formBackgroundColor}>
          <div>
            <AddressField
              label=""
              state={eligibilityError ? 'error' : undefined}
              stateRelatedMessage={eligibilityError ? "Une erreur est survenue pendant le test d'éligibilité." : undefined}
              nativeInputProps={{ placeholder: 'Tapez ici votre adresse', required: true }}
              value={address}
              onSelect={handleAddressSelected}
              onClear={() => {
                setAddress('');
                setValue('');
                setNetworkName(null);
                setIsEfficientNetwork(false);
                setSelectedAddress(null);
                setEligibilityError(false);
                clearAddressSituation();
              }}
              excludeCities
            />
          </div>
          <div>
            <Select
              label=""
              options={[
                { label: 'Résidentiel', value: 'Résidentiel' },
                { label: 'Tertiaire', value: 'Tertiaire' },
              ]}
              nativeSelectProps={{
                disabled: !selectedAddress,
                onChange: (e) => setStructure(e.target.value as Structure),
                required: true,
                value: structure,
              }}
            />
          </div>
          {structure === 'Tertiaire' && (
            <div>
              <Select
                label=""
                options={tertiarySectorOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                nativeSelectProps={{
                  disabled: !selectedAddress,
                  onChange: (e) => setTertiarySector(e.target.value as TertiarySector),
                  required: true,
                  value: tertiarySector,
                }}
              />
            </div>
          )}
          {structure === 'Tertiaire' && (
            <div>
              <Select
                label=""
                options={[
                  { label: 'Chauffage seul', value: 'non' },
                  { label: 'Chauffage et eau chaude sanitaire', value: 'oui' },
                ]}
                nativeSelectProps={{
                  disabled: !selectedAddress,
                  onChange: (e) => setProducesHotWater(e.target.value as HotWaterProduction),
                  required: true,
                  value: producesHotWater,
                }}
              />
            </div>
          )}
          <div>
            <Input
              label=""
              nativeInputProps={{
                disabled: !selectedAddress,
                min: 1,
                onChange: (e) => setValue(e.target.value),
                pattern: '[0-9]*',
                placeholder: structure === 'Résidentiel' ? 'Nombre de logements' : 'Surface (m²)',
                type: 'number',
                value,
              }}
            />
          </div>
          <div>
            <Input
              label="Prix du CEE actuel (€/kWh cumac)"
              nativeInputProps={{
                min: 0,
                onChange: (e) => setCeeValue(e.target.value),
                placeholder: currentCeeValue.toString(),
                step: '0.00001',
                type: 'number',
                value: ceeValue,
              }}
            />
          </div>
        </Inputs>
        <div>
          <Result cartridge={cartridge} className="simulator-result" color={resultColor} backgroundColor={resultBackgroundColor}>
            <ResultValue>
              {helpAmount.toLocaleString('fr-FR', {
                currency: 'EUR',
                maximumFractionDigits: 0,
                style: 'currency',
              })}
            </ResultValue>
            {structure === 'Résidentiel' && (
              <span>
                soit{' '}
                {(intValue ? helpAmount / intValue : 0).toLocaleString('fr-FR', {
                  maximumFractionDigits: 0,
                  style: 'decimal',
                })}{' '}
                €/logement
              </span>
            )}
          </Result>
          <Disclaimer cartridge={cartridge}>
            <Text size="sm" legacyColor={disclaimerLegacyColor || 'black'}>
              Montant correspondant au prix du CEE actuel :{' '}
              <strong>
                {helpCumac.toLocaleString('fr-FR', {
                  maximumFractionDigits: 0,
                  style: 'decimal',
                })}{' '}
                kWh cumac*
              </strong>
            </Text>
          </Disclaimer>
          <Disclaimer cartridge={cartridge}>
            <Text size="sm" legacyColor={disclaimerLegacyColor || 'black'}>
              *Volumes et montants donnés à titre indicatif.
            </Text>
          </Disclaimer>
          {networkName && (
            <Disclaimer cartridge={cartridge}>
              <Text size="sm" legacyColor={disclaimerLegacyColor || 'black'}>
                Réseau de chaleur : <strong>{networkName}</strong>
              </Text>
            </Disclaimer>
          )}
          {networkName && isEfficientNetwork && (
            <Disclaimer cartridge={cartridge}>
              <Text size="sm" legacyColor={disclaimerLegacyColor || 'black'}>
                Le réseau de chaleur <strong>{networkName}</strong> situé à proximité de votre adresse est considéré comme efficace car il
                utilise au moins 50 % d'énergie renouvelable. Le volume affiché ci-dessus intègre donc une bonification de l'aide.
              </Text>
            </Disclaimer>
          )}
          {networkName && eligibleAid && (
            <Disclaimer cartridge={cartridge}>
              <Text size="sm" legacyColor={disclaimerLegacyColor || 'black'}>
                Le volume affiché correspond à{' '}
                {eligibleAid.noteUrl ? (
                  <a href={eligibleAid.noteUrl} target="_blank" rel="noreferrer">
                    <strong>{eligibleAid.label}</strong>
                  </a>
                ) : (
                  <strong>{eligibleAid.label}</strong>
                )}
                .
              </Text>
            </Disclaimer>
          )}
        </div>
      </Form>
      {withRedirection && (
        <RedirectionButton>
          <Link href="/ressources/aides#contenu">Tout savoir sur cette aide</Link>
        </RedirectionButton>
      )}
      {children}
    </Container>
  );
};

export default Simulator;
