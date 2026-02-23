import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import {
  type DPE,
  DPE_ORDER,
  type ModeDeChauffage,
  type ModeDeChauffageEnriched,
  modeDeChauffageParTypeLogement,
  type Situation,
} from '@/components/choix-chauffage/modesChauffageData';
import { SettingsTopFields } from '@/components/choix-chauffage/SettingsTopFields';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import type { EspaceExterieur } from '@/modules/app/types';
import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import type { AddressDetail } from '@/types/HeatNetworksResponse';
import { postFetchJSON } from '@/utils/network';
import { runWithMinimumDelay } from '@/utils/time';

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

const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];

const DEFAULT_TYPE_LOGEMENT: TypeLogement = 'immeuble_chauffage_collectif';

export default function ChoixChauffageResults() {
  const trpcUtils = trpc.useUtils();
  const engine = useSimulatorEngine();

  const [dpe, setDpe] = useQueryState('dpe', parseAsStringLiteral(DPE_ORDER).withDefault('E' as DPE));
  const [adresse] = useQueryState('adresse');

  const [typeLogement, setTypeLogement] = useQueryState(
    'typeLogement',
    parseAsStringLiteral([
      'immeuble_chauffage_collectif',
      'immeuble_chauffage_individuel',
      'maison_individuelle',
    ] as const satisfies readonly TypeLogement[])
  );

  const [espaceExterieur, setEspaceExterieur] = useQueryState('espaceExterieur', parseAsStringLiteral(espaceExterieurValues));

  const [nbLogements, setNbLogements] = useQueryState('nbLogements', parseAsInteger.withDefault(25));
  const [surfaceMoyenne, setSurfaceMoyenne] = useQueryState('surfaceMoyenne', parseAsInteger.withDefault(70));
  const [habitantsMoyen, setHabitantsMoyen] = useQueryState('habitantsMoyen', parseAsString.withDefault('2'));

  const [codeDepartement, setCodeDepartement] = useState<string>('');
  const [temperatureRef, setTemperatureRef] = useState<number | null>(null);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [addressDetail, setAddressDetail] = useState<AddressDetail | null>(null);

  const batEnr = addressDetail?.batEnr ?? { gmi: false, ppa: false };

  const situation: Situation = useMemo(
    () => ({
      adresse: adresse ?? null,
      dpe,
      espaceExterieur: (espaceExterieur ?? 'none') as EspaceExterieur,
      gmi: batEnr.gmi,
      habitantsMoyen: Number.parseFloat(habitantsMoyen) || 0,
      nbLogements,
      ppa: batEnr.ppa,
      surfaceMoyenne,
    }),
    [adresse, dpe, espaceExterieur, batEnr.gmi, batEnr.ppa, habitantsMoyen, nbLogements, surfaceMoyenne]
  );

  // Pousse la situation dans Publicodes dès qu’elle change (y compris code département / température)
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
      //'type de bâtiment': "'résidentiel'",
      'type de production ECS': "'Avec équipement chauffage'",
    });
  }, [situation, codeDepartement, temperatureRef]);

  const testAddressEligibility = useCallback(
    toastErrors(async (adresseToTest: string) => {
      const results = await searchBANAddresses({
        excludeCities: true,
        limit: 1,
        onlyCities: false,
        query: adresseToTest,
      });

      const geoAddress = results?.[0] as SuggestionItem | undefined;
      if (!geoAddress) {
        setAddressDetail(null);
        setCodeDepartement('');
        setTemperatureRef(null);
        return;
      }

      const [lon, lat] = geoAddress.geometry.coordinates;
      const point = { lat, lon };
      const isCity = geoAddress.properties.label === geoAddress.properties.city;

      const [eligibilityStatus, batEnrDetails, infos] = await runWithMinimumDelay(
        () =>
          Promise.all([
            isCity
              ? trpcUtils.client.reseaux.cityNetwork.query({ city: geoAddress.properties.city })
              : trpcUtils.client.reseaux.eligibilityStatus.query(point),
            trpcUtils.client.batEnr.getBatEnrBatimentDetails.query(point),
            postFetchJSON<LocationInfoResponse>('/api/location-infos', {
              city: geoAddress.properties.city,
              cityCode: geoAddress.properties.citycode,
              lat,
              lon,
              onlyCity: true,
            }),
          ]),
        500
      );
      setCodeDepartement(infos?.infosVille?.departement_id ?? '');
      setTemperatureRef(Number(infos?.infosVille?.temperature_ref_altitude_moyenne));

      setAddressDetail({
        batEnr: {
          gmi: Number(batEnrDetails?.gmi_nappe_200) === 1 || Number(batEnrDetails?.gmi_sonde_200) === 1,
          ppa: batEnrDetails?.etat_ppa === 'PPA Validés',
        },
        geoAddress,
        network: eligibilityStatus,
      });
    }),
    [trpcUtils]
  );

  useEffect(() => {
    if (!adresse) return;
    void testAddressEligibility(adresse);
  }, [adresse, testAddressEligibility]);

  const effectiveTypeLogement = (typeLogement ?? DEFAULT_TYPE_LOGEMENT) as TypeLogement;

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

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className="flex-1 fr-pt-1w">
          <span className="fr-icon-map-pin-2-line text-(--text-default-grey) fr-mr-1w" aria-hidden="true" />
          {adresse}
        </div>
        <div className="hidden md:contents">
          <SettingsTopFields
            withLabel={false}
            typeLogement={typeLogement ?? null}
            setTypeLogement={(v) => void setTypeLogement(v)}
            espaceExterieur={(espaceExterieur ?? null) as EspaceExterieur | null}
            setEspaceExterieur={(v) => void setEspaceExterieur(v)}
          />
        </div>
      </div>
      <ParamsForm
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        typeLogement={typeLogement ?? null}
        setTypeLogement={(v) => void setTypeLogement(v)}
        espaceExterieur={(espaceExterieur ?? null) as EspaceExterieur | null}
        setEspaceExterieur={(v) => void setEspaceExterieur(v)}
        dpe={(dpe ?? 'E') as DPE}
        setDpe={(v) => void setDpe(v)}
        nbLogements={nbLogements}
        setNbLogements={(v) => void setNbLogements(v)}
        surfaceMoyenne={surfaceMoyenne}
        setSurfaceMoyenne={(v) => void setSurfaceMoyenne(v)}
        habitantsMoyen={habitantsMoyen}
        setHabitantsMoyen={(v) => void setHabitantsMoyen(v)}
      />
      <ResultsSection
        title="Solution recommandée"
        items={recommended}
        variant="recommended"
        coutParAnGaz={coutParAnGaz}
        dpeFrom={dpe}
        openAccordionId={openAccordionId}
        onOpenChange={handleAccordionOpenChange}
      />
      <ResultsSection
        title="Autres solutions possibles"
        items={others}
        coutParAnGaz={coutParAnGaz}
        variant="other"
        dpeFrom={dpe}
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
      <div className="border border-gray-200 rounded shadow-lg fr-my-3w fr-px-3w fr-pb-3w">
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
