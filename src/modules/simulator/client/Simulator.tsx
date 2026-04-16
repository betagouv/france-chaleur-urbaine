import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Input from '@codegouvfr/react-dsfr/Input';
import { type ReactNode, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import Tooltip from '@/components/ui/Tooltip';
import { SimulatorFormFields } from '@/modules/simulator/client/SimulatorFormFields';
import { useSimulatorFormState } from '@/modules/simulator/client/useSimulatorFormState';
import { useSimulatorSituation, useSyncSimulatorSituation } from '@/modules/simulator/client/useSimulatorSituation';
import {
  BOOSTED_HEAT_NETWORK_AID_RULE,
  CEE_VALUE_RULE,
  type ConcernedHelp,
  RESIDENTIAL_HEAT_NETWORK_AID_RULE,
  type Structure,
  TERTIARY_HEAT_NETWORK_AID_RULE,
  TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE,
  TOTAL_HEAT_NETWORK_AID_RULE,
} from '@/modules/simulator/constants';
import cx from '@/utils/cx';

function Simulator({ children, withTitle }: { children?: ReactNode; withTitle?: boolean }) {
  const engine = useSimulatorEngine();
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isEfficientNetwork, setIsEfficientNetwork] = useState(false);
  const [ceeValue, setCeeValue] = useState(() => formatCeeValue(engine.getFieldAsNumber(CEE_VALUE_RULE)));
  const { updateSituation } = useSimulatorSituation(engine);
  const resetNetworkContext = () => {
    setNetworkName(null);
    setIsEfficientNetwork(false);
  };
  const { addressErrorMessage, formState, handleAddressChange, handleTypeBatimentChange, updateFormState } = useSimulatorFormState({
    onAddressInfosLoaded: (infos) => {
      setNetworkName(infos.nearestReseauDeChaleur?.nom_reseau ?? null);
      setIsEfficientNetwork((infos.nearestReseauDeChaleur?.['Taux EnR&R'] ?? 0) > 50);
    },
    onAddressSituationChange: updateSituation,
    onReset: resetNetworkContext,
  });

  const structure: Structure = formState.typeBatiment === 'residentiel' ? 'Résidentiel' : 'Tertiaire';
  const hasAmountInputs =
    ((formState.selectedAddress !== null && (formState.typeBatiment === 'residentiel' ? formState.nbLogements : formState.surface)) || 0) >
    0;

  useSyncSimulatorSituation({ ceeValue, engine, formState });

  const helpCumac = hasAmountInputs ? engine.getFieldAsNumber(TOTAL_HEAT_NETWORK_AID_RULE) : 0;
  const helpAmount = hasAmountInputs ? engine.getFieldAsNumber(TOTAL_HEAT_NETWORK_AID_AMOUNT_RULE) : 0;
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
    (helpCumac > 0 && isEfficientNetwork) || addressErrorMessage
      ? {
          label: 'Coup de pouce "Chauffage des bâtiments résidentiels collectifs et tertiaires"',
          noteUrl: getRuleNoteUrl(BOOSTED_HEAT_NETWORK_AID_RULE),
        }
      : helpCumac > 0
        ? {
            label: structure === 'Résidentiel' ? 'BAR-TH-137' : 'BAT-TH-127',
            noteUrl: getRuleNoteUrl(structure === 'Résidentiel' ? RESIDENTIAL_HEAT_NETWORK_AID_RULE : TERTIARY_HEAT_NETWORK_AID_RULE),
          }
        : null;

  return (
    <div className={cx('bg-[#4550e5] text-black', withTitle && 'p-4 my-3')}>
      {withTitle && (
        <div className="mx-auto mb-4 max-w-237.5 text-[20px] font-bold leading-6.25 text-white">
          Estimer le montant du Coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires » pour le raccordement de mon
          bâtiment
        </div>
      )}
      <div className={cx('flex flex-wrap items-start justify-center gap-8', withTitle && 'm-8 ')}>
        <div className="flex-1">
          <SimulatorFormFields
            addressErrorMessage={addressErrorMessage}
            fieldClassName="w-full! min-w-80"
            formState={formState}
            onAddressChange={handleAddressChange}
            onFormStateChange={updateFormState}
            onTypeBatimentChange={handleTypeBatimentChange}
          />
        </div>
        <SimulatorResult
          ceeValue={ceeValue}
          concernedHelp={concernedHelp}
          helpAmount={helpAmount}
          helpCumac={helpCumac}
          nbLogement={formState.nbLogements || 0}
          networkInformation={networkInformation}
          onCeeValueChange={setCeeValue}
          structure={structure}
          addressErrorMessage={addressErrorMessage}
        />
      </div>
      {children}
    </div>
  );
}

function formatCeeValue(value: number) {
  return (value * 1000).toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

type SimulatorResultProps = {
  ceeValue: string;
  concernedHelp: {
    label: string;
    noteUrl?: string;
  } | null;
  helpAmount: number;
  helpCumac: number;
  nbLogement: number;
  networkInformation: string | null;
  onCeeValueChange: (value: string) => void;
  structure: Structure;
  addressErrorMessage?: string;
};
function SimulatorResult({
  ceeValue,
  concernedHelp,
  helpAmount,
  helpCumac,
  nbLogement,
  networkInformation,
  onCeeValueChange,
  structure,
  addressErrorMessage,
}: SimulatorResultProps) {
  return (
    <div className="flex-1">
      <div className="mx-auto flex h-30 w-full flex-col justify-around rounded-xl bg-[#27a658] p-4 text-white">
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
            {(nbLogement > 0 ? helpAmount / nbLogement : 0).toLocaleString('fr-FR', {
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
        {(networkInformation || addressErrorMessage) && concernedHelp && (
          <>
            <div>
              Le calcul se base sur la fiche{' '}
              <a href={concernedHelp.noteUrl} target="_blank" rel="noreferrer">
                <strong>{concernedHelp.label}</strong>
              </a>
              .{' '}
              {!addressErrorMessage && (
                <sup>
                  <Tooltip title={networkInformation} />
                </sup>
              )}
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

export default Simulator;
