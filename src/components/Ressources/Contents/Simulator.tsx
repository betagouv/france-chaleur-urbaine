import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Input from '@codegouvfr/react-dsfr/Input';
import { type ReactNode, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import Tooltip from '@/components/ui/Tooltip';
import { SimulatorFormFields } from '@/modules/simulator/client/SimulatorFormFields';
import { useSimulatorFormState } from '@/modules/simulator/client/useSimulatorFormState';
import {
  useSimulatorSituation,
  useSyncBuildingSituation,
  useSyncCeeValueSituation,
} from '@/modules/simulator/client/useSimulatorSituation';
import {
  BOOSTED_HEAT_NETWORK_AID_RULE,
  CEE_VALUE_RULE,
  type ConcernedHelp,
  RESIDENTIAL_HEAT_NETWORK_AID_RULE,
  STANDARD_HEAT_NETWORK_AID_RULE,
  type Structure,
  TERTIARY_HEAT_NETWORK_AID_RULE,
  TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE,
  TOTAL_HEAT_NETWORK_AID_RULE,
} from '@/modules/simulator/constants';
import cx from '@/utils/cx';

type SimulatorProps = {
  children?: ReactNode;
  withTitle?: boolean;
};
type SimulatorResultProps = {
  ceeValue: string;
  concernedHelp: {
    label: string;
    noteUrl?: string;
  } | null;
  currentCeeValuePlaceholder: string;
  helpAmount: number;
  helpCumac: number;
  housingCountOrArea: number;
  networkInformation: string | null;
  onCeeValueChange: (value: string) => void;
  structure: Structure;
};

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
      <div className="[&_div]:text-sm [&>div]:my-2 text-white">
        <div>
          Montant du certificat :{' '}
          <strong>
            {helpCumac.toLocaleString('fr-FR', {
              maximumFractionDigits: 0,
              style: 'decimal',
            })}{' '}
            kWh cumac
          </strong>
        </div>
        {networkInformation && concernedHelp && (
          <>
            <div>
              Le calcul se base sur la fiche{' '}
              <a href={concernedHelp.noteUrl} target="_blank" rel="noreferrer">
                <strong>{concernedHelp.label}</strong>
              </a>
              .{' '}
              <sup>
                <Tooltip title={networkInformation} />
              </sup>
            </div>
            <div>
              * Montant donné à titre indicatif avec un CEE estimé à{' '}
              <Input
                addon={<span className="flex min-h-8 items-center whitespace-nowrap">€/MWh cumac</span>}
                hideLabel
                label="Le prix actuel d'un CEE"
                classes={{
                  nativeInputOrTextArea: '!w-[3rem] mx-1 rounded px-1 py-0.5',
                  root: '!inline-block !w-auto align-middle',
                  wrap: 'fr-my-0',
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
        )}
      </div>
    </div>
  );
}

function Simulator({ children, withTitle }: SimulatorProps) {
  const engine = useSimulatorEngine();
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isEfficientNetwork, setIsEfficientNetwork] = useState(false);
  const [ceeValue, setCeeValue] = useState('');
  const { updateSituation } = useSimulatorSituation(engine);
  const resetNetworkContext = () => {
    setNetworkName(null);
    setIsEfficientNetwork(false);
  };
  const {
    address: formAddress,
    eligibilityError,
    formState,
    handleAddressSelected,
    handleHousingCountOrAreaChange,
    handleTypeBatimentChange,
    housingCountOrAreaValue,
    isAddressSelected,
    resetAddressSelection,
    updateFormState,
  } = useSimulatorFormState({
    onAddressError: (error) => {
      resetNetworkContext();
      console.error('Simulator eligibility error', error);
    },
    onAddressInfosLoaded: (infos) => {
      setNetworkName(infos.nearestReseauDeChaleur?.nom_reseau ?? null);
      setIsEfficientNetwork((infos.nearestReseauDeChaleur?.['Taux EnR&R'] ?? 0) > 50);
    },
    onAddressInfosMissing: resetNetworkContext,
    onAddressSituationChange: updateSituation,
    onReset: resetNetworkContext,
  });
  const structure: Structure = formState.typeBatiment === 'residentiel' ? 'Résidentiel' : 'Tertiaire';
  const housingCountOrArea = housingCountOrAreaValue ?? 0;
  const hasAmountInputs = isAddressSelected && housingCountOrArea > 0;
  const mainFieldClassName = 'w-full! min-w-80';

  useSyncBuildingSituation({ engine, formState, housingCountOrArea });
  useSyncCeeValueSituation(engine, ceeValue);

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
          <SimulatorFormFields
            address={formAddress}
            eligibilityError={eligibilityError}
            fieldClassName={mainFieldClassName}
            isAddressSelected={isAddressSelected}
            mainValue={housingCountOrAreaValue}
            onAddressClear={resetAddressSelection}
            onAddressSelect={handleAddressSelected}
            onMainValueChange={handleHousingCountOrAreaChange}
            onProducesHotWaterChange={(producesHotWater) => updateFormState('producesHotWater', producesHotWater)}
            onTertiarySectorChange={(tertiarySector) => updateFormState('tertiarySector', tertiarySector)}
            onTypeBatimentChange={handleTypeBatimentChange}
            producesHotWater={formState.producesHotWater}
            tertiarySector={formState.tertiarySector}
            typeBatiment={formState.typeBatiment}
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
