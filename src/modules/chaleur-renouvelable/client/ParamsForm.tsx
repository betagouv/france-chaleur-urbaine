import { type SubmitEvent, useEffect, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { BatEnrBatimentsMap } from '@/modules/chaleur-renouvelable/client/BatEnrBatimentsMap';
import type {
  ChoixChauffageParams,
  SetChoixChauffageParams,
} from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  areParamsFormDraftsEqual,
  normalizeDecimalString,
  normalizeDraftNumbers,
  parseIntegerOrNull,
  toChoixChauffageParams,
  toParamsFormDraft,
} from '@/modules/chaleur-renouvelable/client/params-form-draft';
import { DpeTag } from '@/modules/chaleur-renouvelable/client/results/ui/DpeTag';
import {
  type BatEnrBatiment,
  type DPE,
  DPE_VALUES,
  isEspaceExterieurCompatible,
  type ModeEauChaudeSanitaire,
  modeEauChaudeSanitaireOptions,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { AddressField } from '@/modules/form/AddressField';

import { OutdoorSpaceSelect } from './OutdoorSpaceSelect';

export const HOT_WATER_PARAMS_SECTION_ID = 'choix-chauffage-hot-water-params';

type ParamsFormProps = {
  batiments: BatEnrBatiment[];
  isOpen: boolean;
  setIsOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  values: ChoixChauffageParams;
  onSave: SetChoixChauffageParams;
  geoAddress?: BANAddressFeature;
  setGeoAddress: (val: BANAddressFeature | undefined) => void;
  onSelectGeoAddress?: (val?: BANAddressFeature) => void;
  onAddressError?: () => void;
  selectedBatiment?: BatEnrBatiment | null;
};

/**
 * Formulaire d’ajustement des paramètres de simulation sur la page résultats.
 * Les modifications restent locales jusqu’à validation pour permettre un vrai annuler.
 */
export function ParamsForm({
  batiments,
  isOpen,
  setIsOpen,
  values,
  onSave,
  geoAddress,
  setGeoAddress,
  onSelectGeoAddress,
  onAddressError: _onAddressError,
  selectedBatiment,
}: ParamsFormProps) {
  const currentValues = toParamsFormDraft(values);
  const [draft, setDraft] = useState(currentValues);
  const draftSelectedBatiment =
    draft.constructionId === null
      ? null
      : (batiments.find((batiment) => batiment.batiment_construction_id === draft.constructionId) ?? selectedBatiment);

  useEffect(() => {
    setDraft(currentValues);
  }, [
    currentValues.adresse,
    currentValues.constructionId,
    currentValues.dpe,
    currentValues.espaceExterieur,
    currentValues.habitantsMoyen,
    currentValues.modeEauChaudeSanitaire,
    currentValues.nbLogements,
    currentValues.surfaceMoyenne,
    currentValues.typeLogement,
    currentValues.typeRadiateur,
  ]);

  const isModified = !areParamsFormDraftsEqual(draft, currentValues);

  const handleOpen = () => {
    trackPostHogEvent('fcr_simulator:params_panel_opened');
    setIsOpen(true);
  };

  const handleClose = () => {
    setDraft(currentValues);
    setIsOpen(false);
  };

  const handleCancel = () => {
    trackPostHogEvent('fcr_simulator:parameters_cancelled');
    handleClose();
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextValues = toChoixChauffageParams(draft);

    trackPostHogEvent('fcr_simulator:parameters_saved', {
      dpe: nextValues.dpe,
      ecs_mode: nextValues.modeEauChaudeSanitaire,
      emitter_type: nextValues.typeRadiateur,
      habitants: nextValues.habitantsMoyen ? Number(nextValues.habitantsMoyen) : undefined,
      heating_mode: nextValues.typeLogement,
      nb_logements: nextValues.nbLogements ?? undefined,
      surface_m2: nextValues.surfaceMoyenne ?? undefined,
    });
    onSave(nextValues);

    setDraft(normalizeDraftNumbers(draft));
    setIsOpen(false);
  };

  const handleSelectBatiment = (batiment: BatEnrBatiment) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      constructionId: batiment.batiment_construction_id,
    }));
  };

  return (
    <form id="params-form" className="border border-gray-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      {isOpen ? (
        <div className="flex items-start justify-between gap-4">
          <AddressField
            label=""
            value={draft.adresse}
            className="max-w-100 flex-1"
            nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
            onlyAddress
            onClear={() => {
              setDraft((previousDraft) => ({ ...previousDraft, adresse: '', constructionId: null }));
              setGeoAddress(undefined);
              onSelectGeoAddress?.(undefined);
            }}
            onSelect={(nextAddress) => {
              const nextAddressLabel = nextAddress?.properties?.label ?? '';
              if (nextAddressLabel) {
                trackPostHogEvent('fcr_simulator:address_selected', {
                  address: nextAddressLabel,
                  city: nextAddress?.properties.city,
                  postcode: nextAddress?.properties.postcode,
                  source: 'result',
                });
              }
              setDraft((previousDraft) => ({
                ...previousDraft,
                adresse: nextAddressLabel,
                constructionId: null,
              }));
              setGeoAddress(nextAddress);
              onSelectGeoAddress?.(nextAddress);
            }}
          />
          <button type="button" className="fr-icon-close-line mt-1 text-sm" aria-label="Fermer" onClick={handleClose} />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="uppercase font-bold">
            <span className="fr-icon-map-pin-2-line mr-3" />
            {draft.adresse}
          </div>
          <Button
            full
            priority="secondary"
            iconId="fr-icon-pencil-line"
            className="hidden w-auto md:inline-flex"
            iconPosition="left"
            aria-expanded={isOpen}
            aria-controls="params-form"
            onClick={handleOpen}
          >
            Complétez les paramètres
          </Button>
        </div>
      )}
      <p className="my-3 hidden md:block">
        Ajustez les détails de votre simulation (DPE, nombre de logements, mode de production d’eau chaude...) pour obtenir un calcul plus
        précis des coûts et économies d’énergie.
      </p>
      {isOpen ? (
        <>
          <div className="space-y-4">
            <section>
              <div className="flex items-center gap-2">
                <span className="fr-icon-community-fill" aria-hidden="true" />
                <h3 className="m-0 text-sm font-bold">Bâtiment</h3>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr]">
                <BatEnrBatimentsMap
                  batiments={batiments}
                  initialCenter={geoAddress?.geometry.coordinates}
                  onSelect={handleSelectBatiment}
                  selectedBatiment={draftSelectedBatiment}
                  className="h-full"
                />
                <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 content-start">
                  <InputWithSuffix
                    label="Surface habitable par logement (moy)"
                    suffix="m²"
                    value={draft.surfaceMoyenne}
                    placeholder="70"
                    onChange={(value) => setDraft((previousDraft) => ({ ...previousDraft, surfaceMoyenne: value }))}
                    onBlur={() => {
                      const surfaceM2 = parseIntegerOrNull(draft.surfaceMoyenne);
                      if (surfaceM2 !== null) {
                        trackPostHogEvent('fcr_simulator:surface_changed', { surface_m2: surfaceM2 });
                      }
                    }}
                  />
                  <Input
                    hideOptionalLabel
                    label="Habitants par logement (moy)"
                    nativeInputProps={{
                      inputMode: 'decimal',
                      min: 0,
                      onBlur: () => {
                        const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
                        if (normalizedHabitantsMoyen) {
                          trackPostHogEvent('fcr_simulator:habitants_changed', { habitants: Number(normalizedHabitantsMoyen) });
                        }
                        setDraft((previousDraft) => ({
                          ...previousDraft,
                          habitantsMoyen: normalizedHabitantsMoyen,
                        }));
                      },
                      onChange: (event) => {
                        const nextValue = event.target.value;
                        if (!(nextValue === '' || /^[0-9]+([.,][0-9]*)?$/.test(nextValue))) return;

                        setDraft((previousDraft) => ({ ...previousDraft, habitantsMoyen: nextValue }));
                      },
                      placeholder: '2',
                      step: 0.1,
                      type: 'number',
                      value: draft.habitantsMoyen,
                    }}
                  />
                  <OutdoorSpaceSelect
                    typeLogement={draft.typeLogement}
                    value={draft.espaceExterieur}
                    onChange={(value) => {
                      if (value) {
                        trackPostHogEvent('fcr_simulator:outdoor_space_selected', { outdoor_space: value });
                      }
                      setDraft((previousDraft) => ({ ...previousDraft, espaceExterieur: value }));
                    }}
                  />
                  <Input
                    hideOptionalLabel
                    label="Nombre de logements"
                    nativeInputProps={{
                      inputMode: 'numeric',
                      min: 1,
                      onBlur: () => {
                        const nbLogements = parseIntegerOrNull(draft.nbLogements);
                        if (nbLogements !== null) {
                          trackPostHogEvent('fcr_simulator:nb_logements_changed', { nb_logements: nbLogements });
                        }
                      },
                      onChange: (event) => setDraft((previousDraft) => ({ ...previousDraft, nbLogements: event.target.value })),
                      placeholder: '25',
                      type: 'number',
                      value: draft.nbLogements,
                    }}
                  />
                  <div className="md:col-span-2">
                    <DpeField
                      value={draft.dpe}
                      onChange={(value) => {
                        trackPostHogEvent('fcr_simulator:dpe_changed', { dpe: value });
                        setDraft((previousDraft) => ({ ...previousDraft, dpe: value }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
            <section id={HOT_WATER_PARAMS_SECTION_ID} className="scroll-mt-4">
              <div className="flex items-center gap-2">
                <span className="fr-icon-sensor-fill" aria-hidden="true" />
                <h3 className="m-0 text-sm font-bold">Chauffage et eau chaude sanitaire</h3>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-3">
                <Select
                  label="Mode de chauffage"
                  options={[...typeLogementOptions]}
                  nativeSelectProps={{
                    onChange: (event) => {
                      const nextTypeLogement = (event.target.value || null) as TypeLogement | null;
                      if (nextTypeLogement) {
                        trackPostHogEvent('fcr_simulator:heating_mode_selected', { heating_mode: nextTypeLogement });
                      }
                      setDraft((previousDraft) => ({
                        ...previousDraft,
                        espaceExterieur: isEspaceExterieurCompatible(nextTypeLogement, previousDraft.espaceExterieur)
                          ? previousDraft.espaceExterieur
                          : null,
                        typeLogement: nextTypeLogement,
                      }));
                    },
                    value: draft.typeLogement ?? undefined,
                  }}
                />
                <Select
                  label="Type de radiateurs"
                  options={[...typeRadiateurOptions]}
                  nativeSelectProps={{
                    onChange: (event) => {
                      const nextTypeRadiateur = (event.target.value || null) as TypeRadiateur | null;
                      if (nextTypeRadiateur) {
                        trackPostHogEvent('fcr_simulator:emitter_type_selected', { emitter_type: nextTypeRadiateur });
                      }
                      setDraft((previousDraft) => ({
                        ...previousDraft,
                        typeRadiateur: nextTypeRadiateur,
                      }));
                    },
                    value: draft.typeRadiateur ?? undefined,
                  }}
                />
                <Select
                  label="Mode d’eau chaude sanitaire"
                  options={[{ label: 'Non renseigné', value: '' }, ...modeEauChaudeSanitaireOptions]}
                  nativeSelectProps={{
                    onChange: (event) => {
                      const nextModeEauChaudeSanitaire = (event.target.value || null) as ModeEauChaudeSanitaire | null;
                      if (nextModeEauChaudeSanitaire) {
                        trackPostHogEvent('fcr_simulator:ecs_mode_changed', { ecs_mode: nextModeEauChaudeSanitaire });
                      }
                      setDraft((previousDraft) => ({
                        ...previousDraft,
                        modeEauChaudeSanitaire: nextModeEauChaudeSanitaire,
                      }));
                    },
                    value: draft.modeEauChaudeSanitaire ?? undefined,
                  }}
                />
              </div>
            </section>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" iconId="fr-icon-save-line" disabled={!isModified}>
              Enregistrer et recalculer
            </Button>
            <Button priority="secondary" type="button" onClick={handleCancel} disabled={!isModified}>
              Annuler
            </Button>
          </div>
        </>
      ) : (
        <Button
          full
          priority="secondary"
          iconId="fr-icon-pencil-line"
          className="my-3 md:hidden"
          iconPosition="left"
          aria-expanded={isOpen}
          aria-controls="params-form"
          onClick={handleOpen}
        >
          Complétez les paramètres
        </Button>
      )}
    </form>
  );
}

function DpeField({ value, onChange }: { value: DPE; onChange: (value: DPE) => void }) {
  return (
    <div>
      <div className="mb-2">Étiquette DPE</div>
      <div className="flex flex-wrap gap-1.5">
        {DPE_VALUES.map((dpeValue) => (
          <DpeTag key={dpeValue} letter={dpeValue} isSelected={value === dpeValue} onClick={() => onChange(dpeValue)} />
        ))}
      </div>
    </div>
  );
}

function InputWithSuffix({
  label,
  onChange,
  onBlur,
  placeholder,
  suffix,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  suffix: string;
  value: string;
}) {
  return (
    <div className="fr-input-group w-full">
      <label className="fr-label mb-2">{label}</label>
      <div className="relative">
        <input
          className="fr-input pr-12"
          inputMode="numeric"
          min={1}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onWheel={(event) => {
            if (event.currentTarget.type === 'number') {
              event.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          type="number"
          value={value}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}
