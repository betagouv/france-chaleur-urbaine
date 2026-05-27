import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Input from '@codegouvfr/react-dsfr/Input';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { SimulatorFormFields } from '@/modules/simulator/client/SimulatorFormFields';
import { useSimulatorFormState } from '@/modules/simulator/client/useSimulatorFormState';
import type { TypeBatiment } from '@/modules/simulator/constants';
import { buildPublicodeSituation } from '@/modules/simulator/constants';
import cx from '@/utils/cx';

type ConcernedHelp = {
  label: string;
  noteUrl?: string;
};

function Simulator({ children, withTitle }: { children?: ReactNode; withTitle?: boolean }) {
  const engine = useSimulatorEngine();
  const hasTrackedStarted = useRef(false);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isEfficientNetwork, setIsEfficientNetwork] = useState(false);
  const [ceeValue, setCeeValue] = useState(() => formatCeeValue(engine.getFieldAsNumber('Paramètres économiques . Aides . Valeur CEE')));
  const trackStarted = () => {
    if (hasTrackedStarted.current) {
      return;
    }

    trackPostHogEvent('simu_cee:started');
    hasTrackedStarted.current = true;
  };
  const trackFieldFilled = (fieldName: string, fieldValue?: number | string) => {
    trackPostHogEvent('simu_cee:field_filled', {
      field_name: fieldName,
      field_value: fieldValue,
    });
  };
  const resetSimulatorContext = () => {
    setNetworkName(null);
    setIsEfficientNetwork(false);
    setCeeValue(formatCeeValue(engine.getFieldAsNumber('Paramètres économiques . Aides . Valeur CEE')));
  };
  const { addressErrorMessage, formState, handleAddressChange, handleTypeBatimentChange, resetFormState, updateFormState } =
    useSimulatorFormState({
      onAddressInfosLoaded: (infos) => {
        setNetworkName(infos.nearestReseauDeChaleur?.nom_reseau ?? null);
        setIsEfficientNetwork((infos.nearestReseauDeChaleur?.['Taux EnR&R'] ?? 0) > 50);
      },
      onAddressSituationChange: engine.updateSituation,
      onReset: resetSimulatorContext,
    });

  const handleFormStateChange = <Key extends keyof typeof formState>(key: Key, value: (typeof formState)[Key]) => {
    trackStarted();
    trackFieldFilled(key, typeof value === 'string' || typeof value === 'number' ? value : '');
    updateFormState(key, value);
  };

  const handleSimulatorTypeBatimentChange = (value: TypeBatiment) => {
    trackStarted();
    trackFieldFilled('typeBatiment', value);
    handleTypeBatimentChange(value);
  };

  const handleSimulatorAddressChange = async (...args: Parameters<typeof handleAddressChange>) => {
    if (args[0]) {
      trackStarted();
    }
    trackFieldFilled('address', args[0]?.properties.label ?? '');
    await handleAddressChange(...args);
  };

  const handleCeeValueChange = (value: string) => {
    trackFieldFilled('ceeValue', value);
    setCeeValue(value);
  };

  const handleReset = () => {
    hasTrackedStarted.current = false;
    resetFormState();
  };

  const publicodeSituation = useMemo(
    () => ({
      ...buildPublicodeSituation(formState),
      'Paramètres économiques . Aides . Valeur CEE':
        ceeValue.replace(',', '.').trim() === '' ? null : Number(ceeValue.replace(',', '.').trim()) / 1000,
    }),
    [ceeValue, formState]
  );

  useEffect(() => {
    engine.updateSituation(publicodeSituation);
  }, [engine.internalEngine, publicodeSituation]);

  const hasAmountInputs =
    ((formState.selectedAddress !== null && (formState.typeBatiment === 'résidentiel' ? formState.nbLogements : formState.surface)) || 0) >
    0;

  const helpCumac = hasAmountInputs ? engine.getFieldAsNumber('Calcul Eco . Montant des aides . Réseaux de chaleur . Total') : 0;
  const helpAmount = hasAmountInputs ? engine.getFieldAsNumber('Calcul Eco . Montant des aides . Réseaux de chaleur . Total montant') : 0;
  const networkInformation = networkName
    ? `Le réseau de chaleur "${networkName}" est situé à proximité de votre adresse.${
        isEfficientNetwork
          ? " Il est considéré comme efficace car il utilise au moins 50% d'énergie renouvelable."
          : " Comme il utilise moins de 50% d'énergie renouvelable, il n'est pas éligible au Coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires » mais reste éligible à cette fiche CEE."
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
          noteUrl: getRuleNoteUrl('Calcul Eco . Montant des aides . Réseaux de chaleur . Coup de pouce'),
        }
      : helpCumac > 0
        ? {
            label: formState.typeBatiment === 'résidentiel' ? 'BAR-TH-137' : 'BAT-TH-127',
            noteUrl: getRuleNoteUrl(
              formState.typeBatiment === 'résidentiel'
                ? 'Calcul Eco . Montant des aides . Réseaux de chaleur . BAR-TH-137'
                : 'Calcul Eco . Montant des aides . Réseaux de chaleur . BAT-TH-127'
            ),
          }
        : null;

  useEffect(() => {
    if (!hasAmountInputs) {
      return;
    }

    trackPostHogEvent('simu_cee:result_displayed', {
      building_type: formState.typeBatiment === 'résidentiel' ? 'residentiel' : 'tertiaire',
      eligible: !addressErrorMessage,
      estimated_amount_eur: Number(helpAmount.toFixed(0)),
      network_name: networkName || '',
      surface_m2: formState.typeBatiment === 'tertiaire' ? formState.surface : undefined,
    });
  }, [formState.surface, formState.typeBatiment, hasAmountInputs, helpAmount]);

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
            onAddressChange={handleSimulatorAddressChange}
            onFormStateChange={handleFormStateChange}
            onReset={handleReset}
            onTypeBatimentChange={handleSimulatorTypeBatimentChange}
            engine={engine}
          />
        </div>
        <SimulatorResult
          ceeValue={ceeValue}
          concernedHelp={concernedHelp}
          helpAmount={helpAmount}
          helpCumac={helpCumac}
          nbLogement={formState.nbLogements || 0}
          networkInformation={networkInformation}
          onCeeValueChange={handleCeeValueChange}
          typeBatiment={formState.typeBatiment}
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
  concernedHelp: ConcernedHelp | null;
  helpAmount: number;
  helpCumac: number;
  nbLogement: number;
  networkInformation: string | null;
  onCeeValueChange: (value: string) => void;
  typeBatiment: TypeBatiment;
  addressErrorMessage?: string | null;
};
function SimulatorResult({
  ceeValue,
  concernedHelp,
  helpAmount,
  helpCumac,
  nbLogement,
  networkInformation,
  onCeeValueChange,
  typeBatiment,
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
        {typeBatiment === 'résidentiel' && (
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
          <div>
            Le calcul se base sur la fiche{' '}
            <Link href={concernedHelp.noteUrl || '#'} isExternal>
              <strong>{concernedHelp.label}</strong>
            </Link>
            .{' '}
            {!addressErrorMessage && (
              <sup>
                <Tooltip title={networkInformation} />
              </sup>
            )}
          </div>
        )}
        <div>
          * Montant donné à titre indicatif avec un CEE estimé à{' '}
          <Input
            addon={<span className="flex min-h-8 items-center whitespace-nowrap">€/MWh cumac</span>}
            hideLabel
            label="Le prix actuel d'un CEE"
            classes={{
              nativeInputOrTextArea: 'w-[3rem]! mx-1 rounded px-1 py-0.5',
              root: 'inline-block! w-auto! align-middle',
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
      </div>
    </div>
  );
}

export default Simulator;
