import { useStore } from '@tanstack/react-form';
import { useEffect, useMemo, useRef, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { businessRules } from '@/modules/app/business-rules';
import type { BANAddressFeature } from '@/modules/ban/types';
import { BatEnrBatimentsMap } from '@/modules/chaleur-renouvelable/client/BatEnrBatimentsMap';
import type {
  ChoixChauffageParamSources,
  ChoixChauffageParams,
  SetChoixChauffageParams,
} from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  getParamsFormCompletion,
  normalizeDecimalString,
  normalizeDraftNumbers,
  parseIntegerOrNull,
  toChoixChauffageParamsPatch,
  toParamsFormDraft,
  zParamsForm,
} from '@/modules/chaleur-renouvelable/client/params-form-draft';
import {
  type BatEnrBatiment,
  getModeEauChaudeSanitaireOptions,
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  type ModeEauChaudeSanitaireQueryParam,
  normalizeModeEauChaudeSanitaireForTypeLogement,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { getSimulationPrefillFromBatEnrBatiment } from '@/modules/chaleur-renouvelable/simulation-prefill';
import { AddressField } from '@/modules/form/AddressField';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

import { DpeField } from './DpeField';
import { InputWithSuffix } from './InputWithSuffix';
import { OutdoorSpaceCheckboxes } from './OutdoorSpaceCheckboxes';

export const HOT_WATER_PARAMS_SECTION_ID = 'choix-chauffage-hot-water-params';
const INCOMPLETE_FIELD_MESSAGE = 'À compléter ou vérifier pour affiner vos résultats.';

type ParamsFormProps = {
  batiments: BatEnrBatiment[];
  isOpen: boolean;
  setIsOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  values: ChoixChauffageParams;
  paramSources: ChoixChauffageParamSources;
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
  paramSources,
}: ParamsFormProps) {
  const utils = trpc.useUtils();
  const prefillVersion = useRef(0);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const currentValues = useMemo(() => toParamsFormDraft(values, paramSources), [values, paramSources]);
  const form = useAppForm({
    ...schemaValidation(zParamsForm),
    defaultValues: currentValues,
    onSubmit: async ({ value }) => {
      const nextValues = toChoixChauffageParamsPatch(value);

      trackPostHogEvent('fcr_simulator:parameters_saved', {
        dpe: value.dpe,
        ecs_mode: value.modeEauChaudeSanitaire,
        emitter_type: nextValues.typeRadiateur,
        habitants: nextValues.habitantsMoyen ? Number(nextValues.habitantsMoyen) : undefined,
        heating_mode: nextValues.typeLogement,
        nb_logements: nextValues.nbLogements ?? undefined,
        surface_m2: nextValues.surfaceMoyenne ?? undefined,
      });
      await onSave(nextValues);

      form.reset(normalizeDraftNumbers(value));
      setHasPendingAddressChange(false);
      setIsOpen(false);
    },
  });
  const draft = useStore(form.store, (state) => state.values);
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  // Address selection also updates the URL and eligibility context before submission.
  const [hasPendingAddressChange, setHasPendingAddressChange] = useState(false);
  const draftSelectedBatiment =
    draft.constructionId === null
      ? null
      : (batiments.find((batiment) => batiment.batiment_construction_id === draft.constructionId) ?? selectedBatiment);

  useEffect(() => {
    // Reflect saved URL parameters, including building-prefill updates, in the editable draft.
    form.reset(currentValues);
  }, [form, currentValues]);

  const isModified = hasPendingAddressChange || !isDefaultValue;
  const completion = getParamsFormCompletion(draft);
  const modeEauChaudeSanitaireOptions = getModeEauChaudeSanitaireOptions(draft.typeLogement);

  const handleOpen = () => {
    trackPostHogEvent('fcr_simulator:params_panel_opened');
    setIsOpen(true);
  };

  const handleClose = () => {
    prefillVersion.current += 1;
    setIsPrefilling(false);
    form.reset(currentValues);
    setHasPendingAddressChange(false);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (!isModified) {
      handleClose();
      return;
    }

    trackPostHogEvent('fcr_simulator:parameters_cancelled');
    handleClose();
  };

  const handleSelectBatiment = toastErrors(async (batiment: BatEnrBatiment) => {
    const version = ++prefillVersion.current;
    setIsPrefilling(true);
    form.setFieldValue('constructionId', batiment.batiment_construction_id);
    const previous = form.state.values;
    try {
      const prefillParams = {
        ...getSimulationPrefillFromBatEnrBatiment(batiment),
        ...(batiment.batiment_construction_id
          ? await utils.batEnr.getSimulationPrefill.fetch({ batiment_construction_id: batiment.batiment_construction_id })
          : {}),
      };
      if (prefillVersion.current !== version || form.state.values.constructionId !== batiment.batiment_construction_id) {
        return;
      }
      // Keep edits made while the remote prefill was loading.
      const current = form.state.values;
      if (prefillParams.dpe && current.dpe === previous.dpe) {
        form.setFieldValue('dpe', prefillParams.dpe);
        form.setFieldValue('isDpeExplicit', true);
      }
      if (
        prefillParams.modeEauChaudeSanitaire &&
        current.modeEauChaudeSanitaire === previous.modeEauChaudeSanitaire &&
        current.typeLogement === previous.typeLogement
      ) {
        form.setFieldValue('isModeEauChaudeSanitaireInferred', false);
        form.setFieldValue(
          'modeEauChaudeSanitaire',
          normalizeModeEauChaudeSanitaireForTypeLogement(prefillParams.modeEauChaudeSanitaire, current.typeLogement)
        );
      }
      if (prefillParams.nbLogements !== undefined && current.nbLogements === previous.nbLogements) {
        form.setFieldValue('nbLogements', String(prefillParams.nbLogements));
      }
      if (prefillParams.surfaceMoyenne !== undefined && current.surfaceMoyenne === previous.surfaceMoyenne) {
        form.setFieldValue('surfaceMoyenne', String(prefillParams.surfaceMoyenne));
      }
    } finally {
      if (prefillVersion.current === version) {
        setIsPrefilling(false);
      }
    }
  });

  return (
    <Form form={form} id="params-form" className={cx('border border-gray-200 bg-white p-4 shadow-sm', !isOpen && 'sticky top-0 z-20')}>
      {isOpen ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-2 mb-5">
            <span className="fr-icon-map-pin-2-line mt-2 shrink-0 text-sm" aria-hidden="true" />
            <AddressField
              label=""
              value={draft.adresse}
              className="max-w-100 flex-1"
              nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
              onlyAddress
              onClear={() => {
                setHasPendingAddressChange(true);
                form.setFieldValue('adresse', '');
                form.setFieldValue('constructionId', null);
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
                setHasPendingAddressChange(true);
                form.setFieldValue('adresse', nextAddressLabel);
                form.setFieldValue('constructionId', null);
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
            <ParamsNotificationBadge count={completion.incompleteCount} />
          </Button>
        </div>
      )}
      <ParamsIncompleteAlert count={completion.incompleteCount} />
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
                      form.setFieldValue('espaceExterieur', draft.espaceExterieur ?? 'none');
                      form.setFieldValue('isModeEauChaudeSanitaireInferred', false);
                      form.setFieldValue(
                        'modeEauChaudeSanitaire',
                        normalizeModeEauChaudeSanitaireForTypeLogement(draft.modeEauChaudeSanitaire, nextTypeLogement) ??
                          MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE
                      );
                      form.setFieldValue('typeLogement', nextTypeLogement);
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
                      form.setFieldValue('typeRadiateur', nextTypeRadiateur);
                    },
                    value: draft.typeRadiateur ?? undefined,
                  }}
                />
                <Select
                  label="Mode d’eau chaude sanitaire"
                  options={[{ label: 'Non renseigné', value: MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE }, ...modeEauChaudeSanitaireOptions]}
                  state={completion.isModeEauChaudeSanitaireIncomplete ? 'error' : 'default'}
                  stateRelatedMessage={INCOMPLETE_FIELD_MESSAGE}
                  nativeSelectProps={{
                    onBlur: () => {
                      if (!draft.isModeEauChaudeSanitaireInferred || !draft.modeEauChaudeSanitaire) {
                        return;
                      }

                      form.setFieldValue('isModeEauChaudeSanitaireInferred', false);
                    },
                    onChange: (event) => {
                      const nextModeEauChaudeSanitaire = event.target.value as ModeEauChaudeSanitaireQueryParam;
                      if (nextModeEauChaudeSanitaire) {
                        trackPostHogEvent('fcr_simulator:ecs_mode_changed', { ecs_mode: nextModeEauChaudeSanitaire });
                      }
                      form.setFieldValue('isModeEauChaudeSanitaireInferred', false);
                      form.setFieldValue('modeEauChaudeSanitaire', nextModeEauChaudeSanitaire);
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
                <span className="text-xs text-gray-500">sources : RNIC et CSTB</span>
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
                    <form.AppField name="surfaceMoyenne">
                      {(field) => (
                        <field.CustomField
                          Component={InputWithSuffix}
                          label="Surface habitable par logement (moy)"
                          suffix="m²"
                          placeholder="70"
                          inputMode="numeric"
                          min={String(businessRules.fcrMinimumAverageHousingArea.value)}
                          step="1"
                          onBlur={() => {
                            field.handleBlur();
                            const surfaceM2 = parseIntegerOrNull(draft.surfaceMoyenne);
                            if (surfaceM2 !== null) {
                              trackPostHogEvent('fcr_simulator:surface_changed', { surface_m2: surfaceM2 });
                            }
                          }}
                        />
                      )}
                    </form.AppField>
                    <InputWithSuffix
                      label="Habitants par logement (moy)"
                      suffix="personnes"
                      value={draft.habitantsMoyen}
                      placeholder="2"
                      step="0.1"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      state={completion.isHabitantsMoyenIncomplete ? 'error' : 'default'}
                      stateRelatedMessage={INCOMPLETE_FIELD_MESSAGE}
                      onBlur={() => {
                        const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
                        if (normalizedHabitantsMoyen) {
                          trackPostHogEvent('fcr_simulator:habitants_changed', { habitants: Number(normalizedHabitantsMoyen) });
                        }
                        form.setFieldValue('habitantsMoyen', normalizedHabitantsMoyen);
                      }}
                      onChange={(value) => {
                        if (!(value === '' || /^[0-9]+([.,][0-9]*)?$/.test(value))) return;

                        form.setFieldValue('habitantsMoyen', value);
                      }}
                    />
                    <Input
                      hideOptionalLabel
                      label="Nombre de logements"
                      state={completion.isNbLogementsIncomplete ? 'error' : 'default'}
                      stateRelatedMessage={INCOMPLETE_FIELD_MESSAGE}
                      nativeInputProps={{
                        'aria-invalid': completion.isNbLogementsIncomplete,
                        inputMode: 'numeric',
                        min: 1,
                        onBlur: () => {
                          const nbLogements = parseIntegerOrNull(draft.nbLogements);
                          if (nbLogements !== null) {
                            trackPostHogEvent('fcr_simulator:nb_logements_changed', { nb_logements: nbLogements });
                          }
                        },
                        onChange: (event) => form.setFieldValue('nbLogements', event.target.value),
                        placeholder: '25',
                        type: 'number',
                        value: draft.nbLogements,
                      }}
                    />
                  </div>
                  <div>
                    <DpeField
                      value={draft.dpe}
                      hasError={completion.isDpeIncomplete}
                      onChange={(value) => {
                        trackPostHogEvent('fcr_simulator:dpe_changed', { dpe: value });
                        form.setFieldValue('dpe', value);
                        form.setFieldValue('isDpeExplicit', true);
                      }}
                    />
                    <OutdoorSpaceCheckboxes
                      className="mt-5"
                      value={draft.espaceExterieur}
                      layout="stacked"
                      onChange={(value) => {
                        if (value) {
                          trackPostHogEvent('fcr_simulator:outdoor_space_selected', { outdoor_space: value });
                        }
                        form.setFieldValue('espaceExterieur', value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" iconId="fr-icon-save-line" disabled={!isModified || isPrefilling}>
              Enregistrer et recalculer
            </Button>
            <Button priority="secondary" type="button" onClick={handleCancel}>
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
          <ParamsNotificationBadge count={completion.incompleteCount} />
        </Button>
      )}
    </Form>
  );
}

type ParamsNotificationBadgeProps = {
  count: number;
};

function ParamsNotificationBadge({ count }: ParamsNotificationBadgeProps) {
  if (count === 0) {
    return null;
  }

  return <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-xs font-bold text-white">{count}</span>;
}

type ParamsIncompleteAlertProps = {
  count: number;
};

function ParamsIncompleteAlert({ count }: ParamsIncompleteAlertProps) {
  if (count === 0) {
    return null;
  }

  return (
    <p className="my-3 bg-[#FFF6D8] px-4 py-3 font-bold text-[#C74700]">
      <span className="fr-icon-warning-fill mr-2" aria-hidden="true" />
      {count} information{count > 1 ? 's' : ''} à compléter ou vérifier <span className="font-normal">pour affiner vos résultats.</span>
    </p>
  );
}
