import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Input from '@codegouvfr/react-dsfr/Input';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { type ReactNode, useEffect, useState } from 'react';

import { addresseToPublicodesRules } from '@/components/ComparateurPublicodes/mappings';
import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import Tooltip from '@/components/ui/Tooltip';
import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField } from '@/modules/form/AddressField';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import cx from '@/utils/cx';
import { postFetchJSON } from '@/utils/network';
import { ObjectEntries } from '@/utils/typescript';

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
type ConcernedHelp = {
  label: string;
  noteUrl?: string;
};
type SimulatorProps = {
  children?: ReactNode;
  withTitle?: boolean;
};
type SimulatorSituation = Partial<Record<RuleName, number | string | null>>;
type SimulatorResultProps = {
  ceeValue: string;
  concernedHelp: ConcernedHelp | null;
  currentCeeValuePlaceholder: string;
  helpAmount: number;
  helpCumac: number;
  housingCountOrArea: number;
  networkInformation: string | null;
  onCeeValueChange: (value: string) => void;
  structure: Structure;
};

const buildAddressSituation = (infos: LocationInfoResponse): SimulatorSituation =>
  ObjectEntries(addresseToPublicodesRules).reduce<SimulatorSituation>((acc, [key, infoGetter]) => {
    acc[key] = infoGetter(infos) ?? null;
    return acc;
  }, {});

const buildClearedAddressSituation = (): SimulatorSituation =>
  ObjectEntries(addresseToPublicodesRules).reduce<SimulatorSituation>((acc, [key]) => {
    acc[key] = null;
    return acc;
  }, {});

function SimulatorResult({
  ceeValue,
  concernedHelp,
  currentCeeValuePlaceholder,
  helpAmount,
  helpCumac,
  housingCountOrArea,
  networkInformation,
  onCeeValueChange,
  structure,
}: SimulatorResultProps) {
  return (
    <div className="flex-1">
      <div
        className={cx(
          'simulator-result mx-auto flex h-[125px] w-full flex-col justify-around rounded-xl bg-[#27a658] p-4 text-[20px] text-white',
          'min-[450px]:min-w-[300px]'
        )}
      >
        <div className="text-[44px] font-bold">
          {helpAmount.toLocaleString('fr-FR', {
            currency: 'EUR',
            maximumFractionDigits: 0,
            style: 'currency',
          })}
          *
        </div>
        {structure === 'Résidentiel' && (
          <span>
            soit{' '}
            {(housingCountOrArea ? helpAmount / housingCountOrArea : 0).toLocaleString('fr-FR', {
              maximumFractionDigits: 0,
              style: 'decimal',
            })}{' '}
            €/logement
          </span>
        )}
      </div>
      <div className="[&_p]:my-1 [&_p]:text-sm">
        <p>
          Montant du certificat :{' '}
          <strong>
            {helpCumac.toLocaleString('fr-FR', {
              maximumFractionDigits: 0,
              style: 'decimal',
            })}{' '}
            kWh cumac
          </strong>
        </p>
        {networkInformation &&
          (concernedHelp ? (
            <>
              <p>
                Le calcul se base sur la fiche{' '}
                <a href={concernedHelp.noteUrl} target="_blank" rel="noreferrer">
                  <strong>{concernedHelp.label}</strong>
                </a>
                .{' '}
                <sup>
                  <Tooltip title={networkInformation} />
                </sup>
              </p>
              <div className="my-1 text-sm">
                * Montant donné à titre indicatif avec un CEE estimé à{' '}
                <Input
                  addon={<span className="flex min-h-8 items-center whitespace-nowrap text-black">€/MWh cumac</span>}
                  hideLabel
                  label="Le prix actuel d'un CEE"
                  classes={{
                    nativeInputOrTextArea: '!w-[3rem] mx-1 rounded px-1 py-0.5',
                    root: '!inline-block !w-auto align-middle',
                    wrap: 'fr-mt-0',
                  }}
                  nativeInputProps={{
                    'aria-label': "Le prix actuel d'un CEE en euros par MWh cumac",
                    inputMode: 'decimal',
                    onChange: (e) => onCeeValueChange(e.target.value),
                    placeholder: currentCeeValuePlaceholder,
                    type: 'text',
                    value: ceeValue,
                  }}
                />
              </div>
            </>
          ) : (
            <p>{networkInformation}</p>
          ))}
      </div>
    </div>
  );
}

function Simulator({ children, withTitle }: SimulatorProps) {
  const engine = useSimulatorEngine();
  const [structure, setStructure] = useState<Structure>('Résidentiel');
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

  const isAddressSelected = selectedAddress !== null;
  const housingCountOrArea = Number.parseInt(value, 10);
  const hasAmountInputs = isAddressSelected && housingCountOrArea > 0;
  const mainFieldClassName = 'w-full! min-w-80';

  const updateSituation = (partialSituation: SimulatorSituation) => {
    engine.setSituation({
      ...engine.getSituation(),
      ...partialSituation,
    });
  };

  const clearAddressSituation = () => {
    updateSituation(buildClearedAddressSituation());
  };

  const resetAddressSelection = () => {
    setAddress('');
    setValue('');
    setNetworkName(null);
    setIsEfficientNetwork(false);
    setSelectedAddress(null);
    setEligibilityError(false);
    clearAddressSituation();
  };

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    updateSituation({
      'méthode tertiaire': structure === 'Tertiaire' ? `'${tertiarySector}'` : null,
      "nombre de logements dans l'immeuble concerné": structure === 'Résidentiel' && housingCountOrArea > 0 ? housingCountOrArea : null,
      'Production eau chaude sanitaire': structure === 'Tertiaire' ? producesHotWater : 'oui',
      'surface logement type tertiaire': structure === 'Tertiaire' && housingCountOrArea > 0 ? housingCountOrArea : null,
      'type de bâtiment': `'${structure.toLowerCase()}'`,
    });
  }, [engine.loaded, housingCountOrArea, producesHotWater, structure, tertiarySector]);

  useEffect(() => {
    if (!engine.loaded) {
      return;
    }

    const normalizedCeeValue = ceeValue.replace(',', '.').trim();
    const parsedCeeValue = normalizedCeeValue === '' ? null : Number(normalizedCeeValue) / 1000;

    updateSituation({
      [CEE_VALUE_RULE]: parsedCeeValue !== null && Number.isFinite(parsedCeeValue) ? parsedCeeValue : null,
    });
  }, [ceeValue, engine.loaded]);

  const helpCumac = hasAmountInputs ? engine.getFieldAsNumber(TOTAL_HEAT_NETWORK_AID_RULE) : 0;
  const helpAmount = hasAmountInputs ? engine.getFieldAsNumber(TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE) : 0;
  const standardHelp = hasAmountInputs ? engine.getFieldAsNumber(STANDARD_HEAT_NETWORK_AID_RULE) : 0;
  const currentCeeValue = engine.loaded ? engine.getFieldAsNumber(CEE_VALUE_RULE) : 0;
  const currentCeeValuePlaceholder = (currentCeeValue * 1000).toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const networkInformation = networkName
    ? `Le réseau de chaleur "${networkName}" est situé à proximité de votre adresse.${
        isEfficientNetwork ? " Il est considéré comme efficace car il utilise au moins 50 % d'énergie renouvelable." : ''
      }`
    : null;
  const getRuleNoteUrl = (ruleName: RuleName) => {
    const note = engine.getRule(ruleName)?.rawNode.note;
    return typeof note === 'string' ? note : undefined;
  };

  const concernedHelp: ConcernedHelp | null =
    helpCumac > 0 && isEfficientNetwork
      ? {
          label: 'Coup de pouce "Chauffage des bâtiments résidentiels collectifs et tertiaires"',
          noteUrl: getRuleNoteUrl(BOOSTED_HEAT_NETWORK_AID_RULE),
        }
      : helpCumac > 0 && standardHelp === helpCumac
        ? {
            label: structure === 'Résidentiel' ? 'BAR-TH-137' : 'BAT-TH-127',
            noteUrl: getRuleNoteUrl(structure === 'Résidentiel' ? RESIDENTIAL_HEAT_NETWORK_AID_RULE : TERTIARY_HEAT_NETWORK_AID_RULE),
          }
        : null;

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

      updateSituation(buildAddressSituation(infos));
    } catch (error) {
      setNetworkName(null);
      setIsEfficientNetwork(false);
      setEligibilityError(true);
      console.error('Simulator eligibility error', error);
    }
  };

  return (
    <div className={cx('bg-[#4550e5] text-black', withTitle && 'p-4 my-3')}>
      {withTitle && (
        <div className="mx-auto mb-4 max-w-[950px] text-[20px] font-bold leading-[25px] text-white">
          Estimer le montant du Coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires » pour le raccordement de mon
          bâtiment
        </div>
      )}
      <div className={cx('flex flex-wrap items-start justify-center gap-8', withTitle && 'm-8 ')}>
        <div className="flex-1">
          <AddressField
            label=""
            state={eligibilityError ? 'error' : undefined}
            stateRelatedMessage={eligibilityError ? "Une erreur est survenue pendant le test d'éligibilité." : undefined}
            nativeInputProps={{
              placeholder: 'Tapez ici votre adresse',
              required: true,
            }}
            value={address}
            onSelect={handleAddressSelected}
            onClear={resetAddressSelection}
            excludeCities
          />
          <Select
            label=""
            options={[
              { label: 'Résidentiel', value: 'Résidentiel' },
              { label: 'Tertiaire', value: 'Tertiaire' },
            ]}
            nativeSelectProps={{
              className: mainFieldClassName,
              disabled: !isAddressSelected,
              onChange: (e) => setStructure(e.target.value as Structure),
              required: true,
              value: structure,
            }}
          />
          {structure === 'Tertiaire' && (
            <>
              <Select
                label=""
                options={tertiarySectorOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                nativeSelectProps={{
                  className: mainFieldClassName,
                  disabled: !isAddressSelected,
                  onChange: (e) => setTertiarySector(e.target.value as TertiarySector),
                  required: true,
                  value: tertiarySector,
                }}
              />
              <Select
                label=""
                options={[
                  { label: 'Chauffage seul', value: 'non' },
                  { label: 'Chauffage et eau chaude sanitaire', value: 'oui' },
                ]}
                nativeSelectProps={{
                  className: mainFieldClassName,
                  disabled: !isAddressSelected,
                  onChange: (e) => setProducesHotWater(e.target.value as HotWaterProduction),
                  required: true,
                  value: producesHotWater,
                }}
              />
            </>
          )}
          <Input
            label=""
            nativeInputProps={{
              disabled: !isAddressSelected,
              min: 1,
              onChange: (e) => setValue(e.target.value),
              pattern: '[0-9]*',
              placeholder: structure === 'Résidentiel' ? 'Nombre de logements' : 'Surface (m²)',
              type: 'number',
              value,
            }}
          />
        </div>
        <SimulatorResult
          ceeValue={ceeValue}
          concernedHelp={concernedHelp}
          currentCeeValuePlaceholder={currentCeeValuePlaceholder}
          helpAmount={helpAmount}
          helpCumac={helpCumac}
          housingCountOrArea={housingCountOrArea}
          networkInformation={networkInformation}
          onCeeValueChange={setCeeValue}
          structure={structure}
        />
      </div>
      {children}
    </div>
  );
}

export default Simulator;
