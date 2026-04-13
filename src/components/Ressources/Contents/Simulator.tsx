import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Input from '@codegouvfr/react-dsfr/Input';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { type ReactNode, useEffect, useState } from 'react';

import { addresseToPublicodesRules } from '@/components/ComparateurPublicodes/mappings';
import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import Link from '@/components/ui/Link';
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

const CONTAINER_BACKGROUND_CLASSNAMES = {
  '#4550e5': 'bg-[#4550e5]',
  'var(--blue-france-975-75)': 'bg-[var(--blue-france-975-75)]',
  'var(--blue-france-main-525)': 'bg-[var(--blue-france-main-525)]',
};

const FORM_FIELD_BACKGROUND_CLASSNAMES = {
  '#4550e5': 'bg-[#4550e5]',
  'var(--blue-france-975-75)': 'bg-[var(--blue-france-975-75)]',
  'var(--blue-france-main-525)': 'bg-[var(--blue-france-main-525)]',
};

const RESULT_BACKGROUND_CLASSNAMES = {
  '#27a658': 'bg-[#27a658]',
  '#F8D86E': 'bg-[#F8D86E]',
};

const RESULT_TEXT_CLASSNAMES = {
  '#fff': 'text-white',
  '#ffffff': 'text-white',
  'var(--blue-france-sun-113-625)': 'text-[var(--blue-france-sun-113-625)]',
};

const DISCLAIMER_TEXT_CLASSNAMES = {
  black: 'text-[var(--grey-50-1000)]',
  darkblue: 'text-[var(--blue-france-sun-113-625)]',
  darkerblue: 'text-[var(--legacy-darker-blue)]',
  lightblue: 'text-[#6060ff]',
  lightgrey: 'text-[#78818D]',
  purple: 'text-[var(--blue-france-main-525)]',
  white: 'text-white',
};

const Simulator = ({
  withRedirection,
  children,
  defaultStructure,
  withTitle,
}: {
  withRedirection?: boolean;
  children?: ReactNode;
  defaultStructure?: string;
  withTitle?: boolean;
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

    const normalizedCeeValue = ceeValue.replace(',', '.').trim();
    const parsedCeeValue = normalizedCeeValue === '' ? null : Number(normalizedCeeValue) / 1000;

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
  const currentCeeValuePlaceholder = (currentCeeValue * 1000).toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const containerBackgroundClassName = CONTAINER_BACKGROUND_CLASSNAMES['#4550e5'];
  const resultBackgroundClassName = RESULT_BACKGROUND_CLASSNAMES['#27a658'];
  const resultTextClassName = 'text-white';
  const disclaimerClassName = 'mt-2 max-w-[400px]';
  const disclaimerTextClassName = 'text-[var(--grey-50-1000)]';
  const mainFieldClassName = 'w-full! min-w-80';

  const getRuleNoteUrl = (ruleName: RuleName) => {
    const note = engine.getRule(ruleName)?.rawNode.note;
    return typeof note === 'string' && note.startsWith('http') ? note : undefined;
  };

  const concernedHelp: ConcernedHelp | null =
    helpCumac > 0 && boostedHelp === helpCumac
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
    <div className={cx('p-4 my-3 text-black', containerBackgroundClassName)}>
      {withTitle && (
        <div className="mx-auto mb-4 max-w-[950px] text-[20px] font-bold leading-[25px] text-white">
          Estimer le montant du Coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires » pour le raccordement de mon
          bâtiment
        </div>
      )}
      <div className="m-8 flex flex-wrap items-start justify-center gap-8">
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
          <Select
            label=""
            options={[
              { label: 'Résidentiel', value: 'Résidentiel' },
              { label: 'Tertiaire', value: 'Tertiaire' },
            ]}
            nativeSelectProps={{
              className: mainFieldClassName,
              disabled: !selectedAddress,
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
                  disabled: !selectedAddress,
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
                  disabled: !selectedAddress,
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
        <div className="flex-1">
          <div
            className={cx(
              'simulator-result mx-auto flex h-[125px] w-full flex-col justify-around rounded-xl p-4 text-[20px]',
              'min-[450px]:min-w-[300px]',
              resultBackgroundClassName,
              resultTextClassName
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
                {(intValue ? helpAmount / intValue : 0).toLocaleString('fr-FR', {
                  maximumFractionDigits: 0,
                  style: 'decimal',
                })}{' '}
                €/logement
              </span>
            )}
          </div>
          <div className=" [&_p]:text-sm  [&_p]:my-1">
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
            {networkName && isEfficientNetwork && (
              <p>
                Le réseau de chaleur <strong>{networkName}</strong> situé à proximité de votre adresse est considéré comme efficace car il
                utilise au moins 50 % d'énergie renouvelable.
              </p>
            )}
            {networkName && concernedHelp && (
              <>
                <p>
                  Le calcul se base sur la fiche{' '}
                  {concernedHelp.noteUrl ? (
                    <a href={concernedHelp.noteUrl} target="_blank" rel="noreferrer">
                      <strong>{concernedHelp.label}</strong>
                    </a>
                  ) : (
                    <strong>{concernedHelp.label}</strong>
                  )}
                  .
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  * Montant donné à titre indicatif avec un CEE estimé à
                  <Input
                    hideLabel
                    label="Le prix actuel d'un CEE"
                    classes={{
                      nativeInputOrTextArea: '!w-[5.5rem] fr-input--sm inline',
                    }}
                    nativeInputProps={{
                      'aria-label': "Le prix actuel d'un CEE en euros par MWh cumac",
                      inputMode: 'decimal',
                      onChange: (e) => setCeeValue(e.target.value),
                      placeholder: currentCeeValuePlaceholder,
                      type: 'text',
                      value: ceeValue,
                    }}
                  />
                  <span className="flex min-h-8 shrink-0 items-center whitespace-nowrap rounded-r-sm px-2.5 text-black">€/MWh cumac</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {withRedirection && (
        <div className="mt-8 text-center">
          <Link href="/ressources/aides#contenu" variant="primary">
            Tout savoir sur cette aide
          </Link>
        </div>
      )}
      {children}
    </div>
  );
};

export default Simulator;
