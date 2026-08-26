import { type SubmitEvent, useEffect, useId, useState } from 'react';

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
  getEspaceExterieurForTypeLogement,
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  type ModeEauChaudeSanitaireQueryParam,
  modeEauChaudeSanitaireOptions,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { getSimulationPrefillFromBatEnrBatiment } from '@/modules/chaleur-renouvelable/simulation-prefill';
import { AddressField } from '@/modules/form/AddressField';

import { OutdoorSpaceCheckboxes } from './OutdoorSpaceCheckboxes';

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
  const [hasPendingLocalChange, setHasPendingLocalChange] = useState(false);
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

  const isModified = hasPendingLocalChange || !areParamsFormDraftsEqual(draft, currentValues);

  const handleOpen = () => {
    trackPostHogEvent('fcr_simulator:params_panel_opened');
    setIsOpen(true);
  };

  const handleClose = () => {
    setDraft(currentValues);
    setHasPendingLocalChange(false);
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
    setHasPendingLocalChange(false);
    setIsOpen(false);
  };

  const handleSelectBatiment = (batiment: BatEnrBatiment) => {
    const prefillParams = getSimulationPrefillFromBatEnrBatiment(batiment);

    setHasPendingLocalChange(true);
    setDraft((previousDraft) => {
      const nextTypeLogement = prefillParams.typeLogement ?? previousDraft.typeLogement;

      return {
        ...previousDraft,
        constructionId: batiment.batiment_construction_id,
        dpe: prefillParams.dpe ?? previousDraft.dpe,
        espaceExterieur: prefillParams.typeLogement
          ? getEspaceExterieurForTypeLogement(nextTypeLogement, previousDraft.espaceExterieur)
          : previousDraft.espaceExterieur,
        modeEauChaudeSanitaire: prefillParams.modeEauChaudeSanitaire ?? previousDraft.modeEauChaudeSanitaire,
        nbLogements: prefillParams.nbLogements === undefined ? previousDraft.nbLogements : String(prefillParams.nbLogements),
        surfaceMoyenne: prefillParams.surfaceMoyenne === undefined ? previousDraft.surfaceMoyenne : String(prefillParams.surfaceMoyenne),
        typeLogement: nextTypeLogement,
      };
    });
  };

  return (
    <form id="params-form" className="border border-gray-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      {isOpen ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <span className="fr-icon-map-pin-2-line mt-2 shrink-0 text-sm" aria-hidden="true" />
            <AddressField
              label=""
              value={draft.adresse}
              className="max-w-100 flex-1"
              nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
              onlyAddress
              onClear={() => {
                setHasPendingLocalChange(true);
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
                setHasPendingLocalChange(true);
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  adresse: nextAddressLabel,
                  constructionId: null,
                }));
                setGeoAddress(nextAddress);
                onSelectGeoAddress?.(nextAddress);
              }}
            />
          </div>
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
            className="relative hidden w-auto md:inline-flex"
            iconPosition="left"
            aria-expanded={isOpen}
            aria-controls="params-form"
            onClick={handleOpen}
          >
            Compléter mes paramètres
            <ParamsNotificationBadge />
          </Button>
        </div>
      )}
      <ParamsIncompleteAlert />
      {isOpen ? (
        <>
          <div className="space-y-4">
            <section id={HOT_WATER_PARAMS_SECTION_ID} className="mb-5 md:mb-0">
              <div className="flex items-center gap-x-2">
                <span className="fr-icon-sensor-fill" aria-hidden="true" />
                <h3 className="m-0 text-base font-bold">Chauffage et eau chaude sanitaire</h3>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-5 md:grid-cols-3 [&_.fr-label]:text-sm">
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
                        espaceExterieur: getEspaceExterieurForTypeLogement(nextTypeLogement, previousDraft.espaceExterieur ?? 'none'),
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
                  options={[{ label: 'Non renseigné', value: MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE }, ...modeEauChaudeSanitaireOptions]}
                  nativeSelectProps={{
                    onChange: (event) => {
                      const nextModeEauChaudeSanitaire = event.target.value as ModeEauChaudeSanitaireQueryParam;
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
            <section>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="fr-icon-community-fill" aria-hidden="true" />
                <h3 className="m-0 text-base font-bold">Bâtiment</h3>
                <span className="text-xs text-gray-500">source : CSTB</span>
              </div>
              <div className="mt-0 md:mt-3 grid grid-cols-1 gap-4 md:grid-cols-[minmax(190px,0.9fr)_minmax(0,2fr)]">
                <BatEnrBatimentsMap
                  batiments={batiments}
                  initialCenter={geoAddress?.geometry.coordinates}
                  onSelect={handleSelectBatiment}
                  selectedBatiment={draftSelectedBatiment}
                  className="h-full"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="[&_.fr-label]:text-sm">
                    <InputWithSuffix
                      label="Surface habitable par logement (moy)"
                      suffix="m²"
                      value={draft.surfaceMoyenne}
                      placeholder="70"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      onChange={(value) => setDraft((previousDraft) => ({ ...previousDraft, surfaceMoyenne: value }))}
                      onBlur={() => {
                        const surfaceM2 = parseIntegerOrNull(draft.surfaceMoyenne);
                        if (surfaceM2 !== null) {
                          trackPostHogEvent('fcr_simulator:surface_changed', { surface_m2: surfaceM2 });
                        }
                      }}
                    />
                    <InputWithSuffix
                      label="Habitants par logement (moy)"
                      suffix="personnes"
                      value={draft.habitantsMoyen}
                      placeholder="2"
                      step="0.1"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      onBlur={() => {
                        const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
                        if (normalizedHabitantsMoyen) {
                          trackPostHogEvent('fcr_simulator:habitants_changed', { habitants: Number(normalizedHabitantsMoyen) });
                        }
                        setDraft((previousDraft) => ({
                          ...previousDraft,
                          habitantsMoyen: normalizedHabitantsMoyen,
                        }));
                      }}
                      onChange={(value) => {
                        if (!(value === '' || /^[0-9]+([.,][0-9]*)?$/.test(value))) return;

                        setDraft((previousDraft) => ({ ...previousDraft, habitantsMoyen: value }));
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
                  </div>
                  <div>
                    <DpeField
                      value={draft.dpe}
                      onChange={(value) => {
                        trackPostHogEvent('fcr_simulator:dpe_changed', { dpe: value });
                        setDraft((previousDraft) => ({ ...previousDraft, dpe: value }));
                      }}
                    />
                    <OutdoorSpaceCheckboxes
                      className="mt-5"
                      typeLogement={draft.typeLogement}
                      value={draft.espaceExterieur}
                      layout="stacked"
                      onChange={(value) => {
                        if (value) {
                          trackPostHogEvent('fcr_simulator:outdoor_space_selected', { outdoor_space: value });
                        }
                        setDraft((previousDraft) => ({ ...previousDraft, espaceExterieur: value }));
                      }}
                    />
                  </div>
                </div>
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
          className="relative my-3 md:hidden"
          iconPosition="left"
          aria-expanded={isOpen}
          aria-controls="params-form"
          onClick={handleOpen}
        >
          Compléter mes paramètres
          <ParamsNotificationBadge />
        </Button>
      )}
    </form>
  );
}

function ParamsNotificationBadge() {
  return <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-xs font-bold text-white">4</span>;
}

function ParamsIncompleteAlert() {
  return (
    <p className="my-3 bg-[#FFF6D8] px-4 py-3 font-bold text-[#C74700]">
      <span className="fr-icon-warning-fill mr-2" aria-hidden="true" />4 informations à compléter ou vérifier{' '}
      <span className="font-normal">pour affiner vos résultats.</span>
    </p>
  );
}

function DpeField({ value, onChange }: { onChange: (value: DPE) => void; value: DPE }) {
  return (
    <div className="fr-input-group fr-mb-0">
      <div className="mb-2 text-sm">Étiquette DPE</div>
      <div className="flex flex-wrap gap-1">
        {DPE_VALUES.map((dpeValue) => (
          <DpeTag key={dpeValue} letter={dpeValue} isSelected={value === dpeValue} onClick={() => onChange(dpeValue)} size="md" />
        ))}
      </div>
    </div>
  );
}

type InputWithSuffixProps = {
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  suffix: string;
  type?: 'number' | 'text';
  value: string;
  inputMode: 'search' | 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | undefined;
  min: string;
  step: string;
};

function InputWithSuffix({
  label,
  onChange,
  onBlur,
  placeholder,
  suffix,
  type = 'number',
  value,
  inputMode,
  min,
  step,
}: InputWithSuffixProps) {
  const inputId = useId();
  const suffixDescriptionId = `${inputId}-suffix`;
  const suffixAnchorText = value || placeholder;

  return (
    <div className="fr-input-group w-full">
      <label className="fr-label mb-2" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={suffixDescriptionId}
          className="fr-input pr-12"
          id={inputId}
          inputMode={inputMode}
          min={min}
          step={step}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onWheel={(event) => {
            if (event.currentTarget.type === 'number') {
              event.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        <span id={suffixDescriptionId} className="sr-only">
          Unité : {suffix}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-4 right-12 flex items-center overflow-hidden whitespace-pre text-base leading-6"
        >
          <span className={value ? 'invisible' : 'invisible italic'}>{suffixAnchorText}</span>
          <span className="ml-1 text-gray-500">{suffix}</span>
        </span>
      </div>
    </div>
  );
}
