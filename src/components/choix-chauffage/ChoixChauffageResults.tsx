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
  const urlParams = useChoixChauffageQueryParams();

  const { geoAddress, setGeoAddress, batEnr, codeDepartement, temperatureRef, onSelectGeoAddress, resetEligibility } =
    useAddressEligibility(urlParams.adresse ?? null);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  const situation: Situation = useMemo(
    () => ({
      adresse: urlParams.adresse ?? null,
      dpe: urlParams.dpe,
      espaceExterieur: (urlParams.espaceExterieur ?? 'none') as EspaceExterieur,
      gmi: batEnr.gmi,
      habitantsMoyen: Number.parseFloat(urlParams.habitantsMoyen) || 0,
      nbLogements: urlParams.nbLogements,
      ppa: batEnr.ppa,
      surfaceMoyenne: urlParams.surfaceMoyenne,
    }),
    [
      urlParams.adresse,
      urlParams.dpe,
      urlParams.espaceExterieur,
      urlParams.habitantsMoyen,
      urlParams.nbLogements,
      urlParams.surfaceMoyenne,
      batEnr.gmi,
      batEnr.ppa,
    ]
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

  const effectiveTypeLogement = (urlParams.typeLogement ?? DEFAULT_TYPE_LOGEMENT) as TypeLogement;

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
            adresse={urlParams.adresse ?? null}
            setAdresse={(v) => void urlParams.setAdresse(v)}
            geoAddress={geoAddress}
            setGeoAddress={setGeoAddress}
            onSelectGeoAddress={handleSelectGeoAddress}
            onAddressError={() => {}}
            typeLogement={urlParams.typeLogement ?? null}
            setTypeLogement={(v) => void urlParams.setTypeLogement(v)}
            espaceExterieur={(urlParams.espaceExterieur ?? null) as EspaceExterieur | null}
            setEspaceExterieur={(v) => void urlParams.setEspaceExterieur(v)}
          />
        </div>
      )}
      <ParamsForm
        showTopFields={showTopFieldsInsideParams}
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        adresse={urlParams.adresse ?? null}
        setAdresse={(v) => void urlParams.setAdresse(v)}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onAddressError={() => {}}
        typeLogement={urlParams.typeLogement ?? null}
        setTypeLogement={(v) => void urlParams.setTypeLogement(v)}
        espaceExterieur={(urlParams.espaceExterieur ?? null) as EspaceExterieur | null}
        setEspaceExterieur={(v) => void urlParams.setEspaceExterieur(v)}
        dpe={(urlParams.dpe ?? 'E') as DPE}
        setDpe={(v) => void urlParams.setDpe(v)}
        nbLogements={urlParams.nbLogements}
        setNbLogements={(v) => void urlParams.setNbLogements(v)}
        surfaceMoyenne={urlParams.surfaceMoyenne}
        setSurfaceMoyenne={(v) => void urlParams.setSurfaceMoyenne(v)}
        habitantsMoyen={urlParams.habitantsMoyen}
        setHabitantsMoyen={(v) => void urlParams.setHabitantsMoyen(v)}
      />

      <ResultsSection
        title="Solution recommandée"
        items={recommended}
        variant="recommended"
        coutParAnGaz={coutParAnGaz}
        dpeFrom={urlParams.dpe}
        openAccordionId={openAccordionId}
        onOpenChange={handleAccordionOpenChange}
      />

      <ResultsSection
        title="Autres solutions possibles"
        items={others}
        coutParAnGaz={coutParAnGaz}
        variant="other"
        dpeFrom={urlParams.dpe}
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
