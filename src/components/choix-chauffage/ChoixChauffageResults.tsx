import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useCallback, useEffect, useMemo, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import {
  type DPE,
  type ModeDeChauffage,
  type ModeDeChauffageEnriched,
  modeDeChauffageParTypeLogement,
  type Situation,
} from '@/components/choix-chauffage/modesChauffageData';
import { SettingsTopFields } from '@/components/choix-chauffage/SettingsTopFields';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import { useAddressEligibility } from '@/components/choix-chauffage/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/components/choix-chauffage/useChoixChauffageQueryParams';
import useIsMobile from '@/hooks/useIsMobile';
import type { EspaceExterieur } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';

import { ParamsForm } from './ParamsForm';
import { ResultRowAccordion, ScrollToHelpButton } from './ResultRowAccordion';

type ResultsSectionProps = {
  title: string;
  items: ModeDeChauffageEnriched[];
  variant: 'recommended' | 'other';
  dpeFrom: DPE;
  openAccordionId: string | null;
  coutParAnGaz: number;
  onOpenChange: (id: string, expanded: boolean) => void;
};

const DEFAULT_TYPE_LOGEMENT: TypeLogement = 'immeuble_chauffage_collectif';

export default function ChoixChauffageResults() {
  const engine = useSimulatorEngine();
  const isMobile = useIsMobile();
  const qp = useChoixChauffageQueryParams();

  const { geoAddress, setGeoAddress, addressDetail, codeDepartement, temperatureRef, onSelectGeoAddress, resetEligibility } =
    useAddressEligibility(qp.adresse ?? null);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  const batEnr = addressDetail?.batEnr ?? { gmi: false, ppa: false };

  const situation: Situation = useMemo(
    () => ({
      adresse: qp.adresse ?? null,
      dpe: qp.dpe,
      espaceExterieur: (qp.espaceExterieur ?? 'none') as EspaceExterieur,
      gmi: batEnr.gmi,
      habitantsMoyen: Number.parseFloat(qp.habitantsMoyen) || 0,
      nbLogements: qp.nbLogements,
      ppa: batEnr.ppa,
      surfaceMoyenne: qp.surfaceMoyenne,
    }),
    [qp.adresse, qp.dpe, qp.espaceExterieur, qp.habitantsMoyen, qp.nbLogements, qp.surfaceMoyenne, batEnr.gmi, batEnr.ppa]
  );

  // Pousse la situation dans Publicodes dès qu’elle change
  useEffect(() => {
    if (!codeDepartement) return;

    engine.setSituation({
      'code département': `'${codeDepartement}'`,
      DPE: `'${situation.dpe}'`,
      'Inclure la climatisation': 'non',
      "Nombre d'habitants moyen par appartement": `${situation.habitantsMoyen}`,
      "nombre de logements dans l'immeuble concerné": situation.nbLogements,
      'Production eau chaude sanitaire': 'oui',
      'surface logement type tertiaire': `${situation.surfaceMoyenne}`,
      'température de référence chaud commune': temperatureRef,
      'type de production ECS': "'Avec équipement chauffage'",
    });
  }, [situation, codeDepartement, temperatureRef]);

  const effectiveTypeLogement = (qp.typeLogement ?? DEFAULT_TYPE_LOGEMENT) as TypeLogement;

  const modesDeChauffage: ModeDeChauffage[] = useMemo(() => {
    return modeDeChauffageParTypeLogement[effectiveTypeLogement].filter((m) => m.estPossible(situation));
  }, [effectiveTypeLogement, situation]);

  const modesWithCout: ModeDeChauffageEnriched[] = useMemo(() => {
    return modesDeChauffage.map((it) => {
      const coutParAn = it.coutParAnPublicodeKey
        ? Number(engine.getField(`Bilan x ${it.coutParAnPublicodeKey} . total avec aides` as RuleName) ?? 0)
        : 0;
      return { ...it, coutParAn };
    });
  }, [modesDeChauffage, engine]);

  const coutParAnGaz = Number(engine.getField(`Bilan x Gaz coll sans cond . total avec aides` as RuleName) ?? 0);
  const recommended = modesWithCout.slice(0, 1);
  const others = modesWithCout.slice(1);

  const handleAccordionOpenChange = useCallback((id: string, expanded: boolean) => {
    setOpenAccordionId(expanded ? id : null);
  }, []);
  const handleSelectGeoAddress = useCallback(
    (ga?: SuggestionItem) => {
      if (!ga) {
        resetEligibility();
        return;
      }
      onSelectGeoAddress(ga);
    },
    [onSelectGeoAddress, resetEligibility]
  );

  // pendant l’hydration, on évite de rendre conditionnellement (isMobile null)
  if (isMobile === null) return null;

  const showTopFieldsInsideParams = isMobile;
  return (
    <>
      {!showTopFieldsInsideParams && (
        <div className="fr-mb-2w">
          <SettingsTopFields
            withLabel={false}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            adresse={qp.adresse ?? null}
            setAdresse={(v) => void qp.setAdresse(v)}
            geoAddress={geoAddress}
            setGeoAddress={setGeoAddress}
            onSelectGeoAddress={handleSelectGeoAddress}
            onAddressError={() => {}}
            typeLogement={qp.typeLogement ?? null}
            setTypeLogement={(v) => void qp.setTypeLogement(v)}
            espaceExterieur={(qp.espaceExterieur ?? null) as EspaceExterieur | null}
            setEspaceExterieur={(v) => void qp.setEspaceExterieur(v)}
          />
        </div>
      )}
      <ParamsForm
        showTopFields={showTopFieldsInsideParams}
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        adresse={qp.adresse ?? null}
        setAdresse={(v) => void qp.setAdresse(v)}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onAddressError={() => {}}
        typeLogement={qp.typeLogement ?? null}
        setTypeLogement={(v) => void qp.setTypeLogement(v)}
        espaceExterieur={(qp.espaceExterieur ?? null) as EspaceExterieur | null}
        setEspaceExterieur={(v) => void qp.setEspaceExterieur(v)}
        dpe={(qp.dpe ?? 'E') as DPE}
        setDpe={(v) => void qp.setDpe(v)}
        nbLogements={qp.nbLogements}
        setNbLogements={(v) => void qp.setNbLogements(v)}
        surfaceMoyenne={qp.surfaceMoyenne}
        setSurfaceMoyenne={(v) => void qp.setSurfaceMoyenne(v)}
        habitantsMoyen={qp.habitantsMoyen}
        setHabitantsMoyen={(v) => void qp.setHabitantsMoyen(v)}
      />

      <ResultsSection
        title="Solution recommandée"
        items={recommended}
        variant="recommended"
        coutParAnGaz={coutParAnGaz}
        dpeFrom={qp.dpe}
        openAccordionId={openAccordionId}
        onOpenChange={handleAccordionOpenChange}
      />

      <ResultsSection
        title="Autres solutions possibles"
        items={others}
        coutParAnGaz={coutParAnGaz}
        variant="other"
        dpeFrom={qp.dpe}
        openAccordionId={openAccordionId}
        onOpenChange={handleAccordionOpenChange}
      />
    </>
  );
}

function ResultsSection({ title, items, coutParAnGaz, variant, dpeFrom, openAccordionId, onOpenChange }: ResultsSectionProps) {
  return (
    <>
      <h3 className="fr-mt-6w">{title}</h3>
      <div className="border border-gray-200 bg-white rounded shadow-lg fr-my-3w fr-px-3w fr-pb-3w">
        {items.map((it, i) => {
          const id = it.label;
          return (
            <ResultRowAccordion
              key={id}
              item={it}
              index={i}
              variant={variant}
              coutParAnGaz={coutParAnGaz}
              dpeFrom={dpeFrom}
              isOpen={openAccordionId === id}
              onOpenChange={(expanded) => onOpenChange(id, expanded)}
            />
          );
        })}
        {variant === 'recommended' && <ScrollToHelpButton />}
      </div>
    </>
  );
}
