import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useCallback, useEffect, useMemo, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import AdemeHelp from '@/components/choix-chauffage/AdemeHelp';
import FranceRenovHelp from '@/components/choix-chauffage/FranceRenovHelp';
import {
  type DPE,
  type ModeDeChauffageEnriched,
  modeDeChauffageParTypeLogement,
  type Situation,
} from '@/components/choix-chauffage/modesChauffageData';
import { SettingsTopFields } from '@/components/choix-chauffage/SettingsTopFields';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import { useAddressEligibility } from '@/components/choix-chauffage/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/components/choix-chauffage/useChoixChauffageQueryParams';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import useIsMobile from '@/hooks/useIsMobile';
import { trackPostHogEvent } from '@/modules/analytics/client';
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
      geothermiePossible: batEnr.geothermiePossible,
      habitantsMoyen: Number.parseFloat(urlParams.habitantsMoyen) || 0,
      nbLogements: urlParams.nbLogements,
      planProtectionAtmosphere: batEnr.planProtectionAtmosphere,
      surfaceMoyenne: urlParams.surfaceMoyenne,
    }),
    [
      urlParams.adresse,
      urlParams.dpe,
      urlParams.espaceExterieur,
      urlParams.habitantsMoyen,
      urlParams.nbLogements,
      urlParams.surfaceMoyenne,
      batEnr.geothermiePossible,
      batEnr.planProtectionAtmosphere,
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

  const effectiveTypeLogement = (urlParams.typeLogement ?? 'immeuble_chauffage_collectif') as TypeLogement;

  const modesDeChauffage = useMemo(() => {
    return modeDeChauffageParTypeLogement[effectiveTypeLogement].filter((m) => m.estPossible(situation));
  }, [effectiveTypeLogement, situation]);

  const modesWithCout = useMemo(() => {
    return modesDeChauffage.map((it) => {
      const coutParAn = it.coutParAnPublicodeKey
        ? Number(engine.getField(`Bilan x ${it.coutParAnPublicodeKey} . total avec aides` as RuleName) ?? 0)
        : 0;
      return { ...it, coutParAn };
    });
  }, [modesDeChauffage, engine]);

  const coutParAnGaz = Number(engine.getField(`Bilan x Gaz coll sans cond . total avec aides` as RuleName) ?? 0);
  const [recommended, ...others] = modesWithCout;

  const handleAccordionOpenChange = useCallback((id: string, expanded: boolean) => {
    setOpenAccordionId(expanded ? id : null);
    trackPostHogEvent('chaleur-renouvelable:accordeon', { name: id });
  }, []);
  const handleSelectGeoAddress = useCallback(
    (geoAddress?: SuggestionItem) => {
      if (!geoAddress) {
        resetEligibility();
        return;
      }
      onSelectGeoAddress(geoAddress);
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
      {modesWithCout.length > 0 ? (
        <>
          <ResultsSection
            title="Solution recommandée"
            items={[recommended]}
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

          <CallOut
            title={
              <>
                <span className="fr-icon-lightbulb-line fr-mr-1w" />
                Comment sont calculés ces résultats ?
              </>
            }
            size="lg"
            colorVariant="blue-ecume"
          >
            Nos recommandations sont calculées à partir des informations que vous avez fournies : mode de chauffage, surface moyenne, classe
            DPE, disponibilité d’espaces extérieurs… Ces critères permettent de classer les solutions par pertinence et d’estimer les coûts
            et contraintes techniques propres à votre situation.
            <div className="fr-mt-3w">
              <Link
                postHogEventKey="link:click"
                postHogEventProps={{ link_name: 'cta_comment_calculer_resultat', source: 'chaleur_renouvelable' }}
                href="#"
              >
                En savoir plus
              </Link>
            </div>
          </CallOut>
          <AdemeHelp />
        </>
      ) : (
        <NoResultSection codeInsee={geoAddress?.properties.citycode} />
      )}
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

function NoResultSection({ codeInsee }: { codeInsee?: string }) {
  return (
    <>
      <h3>Aucune solution de chauffage alternative n'est adaptée à votre situation actuelle</h3>
      <p>
        Pas d'inquiétude, d'autres actions permettent de réduire vos consommations d'énergie, vos factures et votre impact environnemental :
      </p>
      <ul>
        <li>
          <strong>Isoler votre logement</strong> : toiture, murs, fenêtres, planchers — c'est souvent le geste le plus efficace
        </li>
        <li>
          <strong>Améliorer votre système de ventilation</strong> : une VMC performante améliore la qualité de l'air et limite les pertes de
          chaleur
        </li>
        <li>
          <strong>Optimiser votre chauffage actuel</strong> : entretien de la chaudière, désembouage des radiateurs, installation de
          robinets thermostatiques
        </li>
        <li>
          <strong>Réduire vos consommations d'eau chaude</strong> : mousseurs, pommeaux économes, calorifugeage des tuyaux
        </li>
      </ul>
      <p>Ces travaux peuvent être éligibles à des aides financières (MaPrimeRénov', CEE, éco-prêt à taux zéro).</p>
      <FranceRenovHelp codeInsee={codeInsee} />
    </>
  );
}
