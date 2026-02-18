import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { type DPE, DPE_ORDER, type ModeDeChauffage, modeDeChauffageParTypeLogement } from '@/components/choix-chauffage/modesChauffageData';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import RichSelect from '@/components/ui/RichSelect';
import type { EspaceExterieur } from '@/modules/app/types';
import { searchBANAddresses } from '@/modules/ban/client';
import type { SuggestionItem } from '@/modules/ban/types';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { AddressDetail } from '@/types/HeatNetworksResponse';
import cx from '@/utils/cx';
import { runWithMinimumDelay } from '@/utils/time';

import { ResultRowAccordion } from './ResultRowAccordion';

const espaceExterieurValues = ['shared', 'private', 'both', 'none'] as const satisfies readonly EspaceExterieur[];
const isNumericLike = (v: string) => v === '' || /^[0-9]+([.,][0-9]*)?$/.test(v);
type SettingsTopFieldsProps = {
  withLabel: boolean;
  typeLogement: TypeLogement | null;
  setTypeLogement: (val: TypeLogement | null) => void;
  espaceExterieur: EspaceExterieur | null;
  setEspaceExterieur: (val: EspaceExterieur | null) => void;
  outdoorOptions: { value: EspaceExterieur; label: string; description?: string }[];
};

function SettingsTopFields({
  withLabel,
  typeLogement,
  setTypeLogement,
  espaceExterieur,
  setEspaceExterieur,
  outdoorOptions,
}: SettingsTopFieldsProps) {
  return (
    <>
      <Select
        label={withLabel ? 'Mode de chauffage' : ''}
        options={[
          { label: 'Immeuble en chauffage collectif', value: 'immeuble_chauffage_collectif' satisfies TypeLogement },
          { label: 'Immeuble en chauffage individuel', value: 'immeuble_chauffage_individuel' satisfies TypeLogement },
          { label: 'Maison individuelle', value: 'maison_individuelle' satisfies TypeLogement },
        ]}
        nativeSelectProps={{
          onChange: (e) => void setTypeLogement(e.target.value as TypeLogement),
          value: typeLogement ?? '',
        }}
      />

      <RichSelect<EspaceExterieur>
        value={espaceExterieur ?? undefined}
        onChange={(val) => void setEspaceExterieur(val)}
        options={outdoorOptions}
        placeholder="Sélectionner vos espaces disponibles"
        label={withLabel ? 'Espaces extérieurs disponibles' : ''}
      />
    </>
  );
}

export default function ChoixChauffageResults() {
  const trpcUtils = trpc.useUtils();

  const [dpe, setDpe] = useQueryState('dpe', parseAsStringLiteral(DPE_ORDER));
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
  const [nbLogements, setNbLogements] = useQueryState('nbLogements', parseAsInteger.withDefault(1));
  const [surfaceMoyenne, setSurfaceMoyenne] = useQueryState('surfaceMoyenne', parseAsInteger.withDefault(0));
  const [habitantsMoyen, setHabitantsMoyen] = useQueryState('habitantsMoyen', parseAsString.withDefault(''));

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [addressDetail, setAddressDetail] = useState<AddressDetail | null>(null);

  const outdoorOptions = useMemo(
    (): { value: EspaceExterieur; label: string; description?: string }[] => [
      { description: 'Cour, jardin, toit terrasse…', label: 'Espaces partagés uniquement', value: 'shared' },
      { description: 'Balcons, terrasses…', label: 'Espaces individuels uniquement', value: 'private' },
      { description: 'Cour, jardin, toit terrasse, balcons…', label: 'Espaces partagés et individuels', value: 'both' },
      { label: 'Aucun espace extérieur', value: 'none' },
    ],
    []
  );

  const testAddressEligibility = useMemo(
    () =>
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
          return;
        }

        const [lon, lat] = geoAddress.geometry.coordinates;
        const isCity = geoAddress.properties.label === geoAddress.properties.city;

        const eligibilityStatus = await runWithMinimumDelay(
          () =>
            isCity
              ? trpcUtils.client.reseaux.cityNetwork.query({ city: geoAddress.properties.city })
              : trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon }),
          500
        );

        setAddressDetail({
          geoAddress,
          network: eligibilityStatus,
        });
      }),
    [trpcUtils]
  );

  useEffect(() => {
    if (!adresse) return;

    const currentLabel = addressDetail?.geoAddress?.properties?.label;
    if (currentLabel && currentLabel === adresse) return;

    void testAddressEligibility(adresse);
  }, [adresse, addressDetail?.geoAddress?.properties?.label, testAddressEligibility]);

  const dpeFrom = (dpe ?? 'E') as DPE;

  const modesDeChauffage: ModeDeChauffage[] = useMemo(
    () => modeDeChauffageParTypeLogement[typeLogement ?? 'immeuble_chauffage_collectif'],
    [typeLogement]
  );

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
            outdoorOptions={outdoorOptions}
          />
        </div>
      </div>
      <div className="md:hidden fr-my-2w">
        <Button
          full
          priority="secondary"
          iconId={isParamsOpen ? 'fr-icon-close-line' : 'fr-icon-add-line'}
          iconPosition="right"
          aria-expanded={isParamsOpen}
          aria-controls="params-form"
          onClick={() => setIsParamsOpen((v) => !v)}
        >
          {isParamsOpen ? 'Fermer' : 'Ouvrir'} les paramètres
        </Button>
      </div>
      <div
        id="params-form"
        className={cx('border border-gray-200 rounded shadow-lg p-4 fr-mb-3w', 'md:block', isParamsOpen ? 'block' : 'hidden')}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Image src="/icons/icon-warning.png" alt="icone d'engrenage" aria-hidden="true" width="24" height="24" />
          Renseignez ces informations pour afficher des coûts affinés
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="md:hidden mb-6 md:mb-0">
            <SettingsTopFields
              withLabel
              typeLogement={typeLogement ?? null}
              setTypeLogement={(v) => void setTypeLogement(v)}
              espaceExterieur={(espaceExterieur ?? null) as EspaceExterieur | null}
              setEspaceExterieur={(v) => void setEspaceExterieur(v)}
              outdoorOptions={outdoorOptions}
            />
          </div>

          <Select
            label="DPE (étiquette énergétique)"
            options={DPE_ORDER.map((i) => ({ label: i, value: i }))}
            nativeSelectProps={{
              onChange: (e) => void setDpe(e.target.value as DPE),
              value: (dpe ?? 'E') as DPE,
            }}
          />

          <Input
            label="Nombre de logements"
            nativeInputProps={{
              inputMode: 'numeric',
              min: 1,
              onBlur: () => {
                // sécurité: au blur on force min 1 si requis
                if ((nbLogements ?? 0) < 1) void setNbLogements(1);
              },
              onChange: (e) => {
                // on laisse l'input gérer l'UI, mais on sync l'URL
                const raw = e.target.value;
                const next = raw === '' ? 0 : Number(raw);
                void setNbLogements(next);
              },
              placeholder: '-',
              required: true,
              type: 'number',
              value: nbLogements,
            }}
          />

          <Input
            label="Surface moyenne / logement"
            nativeInputProps={{
              inputMode: 'numeric',
              min: 0,
              onChange: (e) => {
                const raw = e.target.value;
                const next = raw === '' ? 0 : Number(raw);
                void setSurfaceMoyenne(next);
              },
              placeholder: '- m²',
              required: true,
              type: 'number',
              value: surfaceMoyenne,
            }}
          />

          <Input
            label="Habitants moyen / logement"
            nativeInputProps={{
              inputMode: 'decimal',
              min: 0,
              onBlur: () => {
                const normalized = (habitantsMoyen ?? '').replace(',', '.').replace(/\.$/, '');
                if (normalized === '') {
                  void setHabitantsMoyen('');
                  return;
                }
                const n = Number(normalized);
                if (!Number.isFinite(n) || n < 0) {
                  void setHabitantsMoyen('');
                  return;
                }
                const pretty = String(n);
                void setHabitantsMoyen(pretty);
              },
              onChange: (e) => {
                const raw = e.target.value;
                if (!isNumericLike(raw)) return;
                void setHabitantsMoyen(raw);
              },
              placeholder: '-',
              required: true,
              step: 0.1,
              type: 'number',
              value: habitantsMoyen,
            }}
          />
        </div>
      </div>
      <h3 className="fr-mt-6w">Solution recommandée</h3>
      <div className="border border-gray-200 rounded shadow-lg fr-my-3w fr-px-3w fr-pb-3w">
        {modesDeChauffage[0] && (
          <ResultRowAccordion
            item={modesDeChauffage[0]}
            index={0}
            variant="recommended"
            dpeFrom={dpeFrom}
            isOpen={openAccordionId === modesDeChauffage[0].label}
            onOpenChange={(expanded) => handleAccordionOpenChange(modesDeChauffage[0].label, expanded)}
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
              dpeFrom={dpeFrom}
              isOpen={openAccordionId === id}
              onOpenChange={(expanded) => handleAccordionOpenChange(id, expanded)}
            />
          );
        })}
      </div>
    </>
  );
}
