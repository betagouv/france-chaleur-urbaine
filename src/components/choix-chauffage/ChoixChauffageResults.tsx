import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type DPE,
  DPE_ORDER,
  type ModeDeChauffage,
  modeDeChauffageParTypeLogement,
  type Situation,
} from '@/components/choix-chauffage/modesChauffageData';
import { SettingsTopFields } from '@/components/choix-chauffage/SettingsTopFields';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import Button from '@/components/ui/Button';
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
import { ResultRowAccordion } from './ResultRowAccordion';

const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];

export default function ChoixChauffageResults() {
  const trpcUtils = trpc.useUtils();

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
      espaceExterieur: espaceExterieur as EspaceExterieur,
      gmi: batEnr.gmi,
      habitantsMoyen: parseFloat(habitantsMoyen),
      nbLogements,
      ppa: batEnr.ppa,
      surfaceMoyenne,
    }),
    [espaceExterieur, batEnr.gmi, batEnr.ppa, dpe, adresse, nbLogements, surfaceMoyenne, habitantsMoyen]
  );

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
          gmi: batEnr?.gmi_nappe_200 === 1 || batEnr?.gmi_sonde_200 === 1,
          ppa: batEnr?.etat_ppa === 'PPA Validés',
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
  console.log('typeLogement', situation);
  const modesDeChauffage: ModeDeChauffage[] = useMemo(
    () => modeDeChauffageParTypeLogement[typeLogement ?? 'immeuble_chauffage_collectif'].filter((m) => m.estPossible(situation)),
    [typeLogement, situation]
  );
  const firstMode = modesDeChauffage[0];

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

      <h3 className="fr-mt-6w">Solution recommandée</h3>
      <div className="border border-gray-200 rounded shadow-lg fr-my-3w fr-px-3w fr-pb-3w">
        {firstMode && (
          <ResultRowAccordion
            item={firstMode}
            index={0}
            variant="recommended"
            dpeFrom={dpe}
            isOpen={openAccordionId === firstMode.label}
            onOpenChange={(expanded) => handleAccordionOpenChange(firstMode.label, expanded)}
          />
        )}
        <div className="fr-my-3w flex justify-end">
          <Button
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            onClick={(e) => {
              e.stopPropagation();
              const elt = document.getElementById('help-ademe');
              if (elt) elt.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Je souhaite être accompagné
          </Button>
        </div>
      </div>

      <h3 className="fr-mt-6w">Autres solutions possibles</h3>
      <div className="border border-gray-200 rounded shadow-lg fr-my-3w fr-px-3w fr-pb-3w">
        {modesDeChauffage.slice(1).map((it, i) => {
          const id = it.label;
          return (
            <ResultRowAccordion
              key={id}
              item={it}
              index={i}
              variant="other"
              dpeFrom={dpe}
              isOpen={openAccordionId === id}
              onOpenChange={(expanded) => handleAccordionOpenChange(id, expanded)}
            />
          );
        })}
      </div>
    </>
  );
}
