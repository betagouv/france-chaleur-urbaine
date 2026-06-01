import { type SubmitEvent, useEffect, useState } from 'react';

import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import RichSelect from '@/components/ui/RichSelect';
import type { BANAddressFeature } from '@/modules/ban/types';
import { BatEnrBatimentsMap } from '@/modules/chaleur-renouvelable/client/BatEnrBatimentsMap';
import { DpeTag } from '@/modules/chaleur-renouvelable/client/ChoixChauffageResults';
import type { ChoixChauffageParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  type DPE,
  DPE_VALUES,
  type EspaceExterieur,
  getEspaceExterieurOptions,
  isEspaceExterieurCompatible,
  type ModeEauChaudeSanitaire,
  modeEauChaudeSanitaireOptions,
  type TypeLogement,
  type TypeRadiateur,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/types';
import { AddressField } from '@/modules/form/AddressField';

export const HOT_WATER_PARAMS_SECTION_ID = 'choix-chauffage-hot-water-params';

type ParamsFormDraft = {
  adresse: NonNullable<ChoixChauffageParams['adresse']>;
  dpe: DPE;
  espaceExterieur: ChoixChauffageParams['espaceExterieur'];
  habitantsMoyen: NonNullable<ChoixChauffageParams['habitantsMoyen']>;
  modeEauChaudeSanitaire: ChoixChauffageParams['modeEauChaudeSanitaire'] | null;
  nbLogements: string;
  surfaceMoyenne: string;
  typeLogement: ChoixChauffageParams['typeLogement'];
  typeRadiateur: ChoixChauffageParams['typeRadiateur'];
};

function parseIntegerOrNull(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue === '') return null;

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeDecimalString(value: string) {
  const normalizedValue = value.replace(',', '.').replace(/\.$/, '').trim();
  if (normalizedValue === '') return '';

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? String(parsedValue) : '';
}

function areDraftsEqual(left: ParamsFormDraft, right: ParamsFormDraft) {
  return (
    left.adresse === right.adresse &&
    left.dpe === right.dpe &&
    left.espaceExterieur === right.espaceExterieur &&
    left.habitantsMoyen === right.habitantsMoyen &&
    left.modeEauChaudeSanitaire === right.modeEauChaudeSanitaire &&
    left.nbLogements === right.nbLogements &&
    left.surfaceMoyenne === right.surfaceMoyenne &&
    left.typeLogement === right.typeLogement &&
    left.typeRadiateur === right.typeRadiateur
  );
}

type ParamsFormProps = {
  batiments: BatEnrBatiment[];
  isOpen: boolean;
  setIsOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  values: ChoixChauffageParams;
  onSave: (values: ChoixChauffageParams) => Promise<unknown> | undefined;
  geoAddress?: BANAddressFeature;
  setGeoAddress: (val: BANAddressFeature | undefined) => void;
  onSelectGeoAddress?: (val?: BANAddressFeature) => void;
  onSelectBatiment: (batiment: BatEnrBatiment) => void;
  onAddressError?: () => void;
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
  onSelectBatiment,
  onAddressError: _onAddressError,
}: ParamsFormProps) {
  const currentValues = {
    adresse: values.adresse ?? '',
    dpe: values.dpe,
    espaceExterieur: values.espaceExterieur,
    habitantsMoyen: values.habitantsMoyen ?? '',
    modeEauChaudeSanitaire: values.modeEauChaudeSanitaire,
    nbLogements: values.nbLogements === null ? '' : String(values.nbLogements),
    surfaceMoyenne: values.surfaceMoyenne === null ? '' : String(values.surfaceMoyenne),
    typeLogement: values.typeLogement,
    typeRadiateur: values.typeRadiateur,
  };
  const [draft, setDraft] = useState<ParamsFormDraft>(currentValues);

  useEffect(() => {
    setDraft(currentValues);
  }, [
    currentValues.adresse,
    currentValues.dpe,
    currentValues.espaceExterieur,
    currentValues.habitantsMoyen,
    currentValues.modeEauChaudeSanitaire,
    currentValues.nbLogements,
    currentValues.surfaceMoyenne,
    currentValues.typeLogement,
    currentValues.typeRadiateur,
  ]);

  const isDirty = !areDraftsEqual(draft, currentValues);
  const espaceExterieurOptions = getEspaceExterieurOptions(draft.typeLogement);
  const isEspaceExterieurDisabled = !draft.typeLogement;

  const handleClose = () => {
    setDraft(currentValues);
    setIsOpen(false);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedHabitantsMoyen = normalizeDecimalString(draft.habitantsMoyen);
    const normalizedNbLogements = parseIntegerOrNull(draft.nbLogements);
    const normalizedSurfaceMoyenne = parseIntegerOrNull(draft.surfaceMoyenne);
    const nextValues: ChoixChauffageParams = {
      adresse: draft.adresse || null,
      dpe: draft.dpe,
      espaceExterieur: draft.espaceExterieur,
      habitantsMoyen: normalizedHabitantsMoyen,
      modeEauChaudeSanitaire: draft.modeEauChaudeSanitaire,
      nbLogements: normalizedNbLogements,
      surfaceMoyenne: normalizedSurfaceMoyenne,
      typeLogement: draft.typeLogement,
      typeRadiateur: draft.typeRadiateur,
    };

    onSave(nextValues);

    setDraft({
      ...draft,
      habitantsMoyen: normalizedHabitantsMoyen,
      nbLogements: normalizedNbLogements === null ? '' : String(normalizedNbLogements),
      surfaceMoyenne: normalizedSurfaceMoyenne === null ? '' : String(normalizedSurfaceMoyenne),
    });
    setIsOpen(false);
  };

  return (
    <form id="params-form" className="border border-[#c8efd7] bg-white p-4" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        {isOpen ? (
          <>
            <AddressField
              label=""
              value={draft.adresse}
              className="max-w-100 flex-1"
              nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
              onlyAddress
              onClear={() => {
                setDraft((previousDraft) => ({ ...previousDraft, adresse: '' }));
                setGeoAddress(undefined);
                onSelectGeoAddress?.(undefined);
              }}
              onSelect={(nextAddress) => {
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  adresse: nextAddress?.properties?.label ?? '',
                }));
                setGeoAddress(nextAddress);
                onSelectGeoAddress?.(nextAddress);
              }}
            />
            <button type="button" className="fr-icon-close-line mt-1 text-sm" aria-label="Fermer" onClick={handleClose} />
          </>
        ) : (
          <>
            <div>
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
              onClick={() => setIsOpen(true)}
            >
              Complétez les paramètres
            </Button>
          </>
        )}
      </div>
      <p className="my-3">
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
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="overflow-hidden bg-[#f6f6f6]">
                  <BatEnrBatimentsMap
                    batiments={batiments}
                    initialCenter={geoAddress?.geometry.coordinates}
                    onSelect={onSelectBatiment}
                    className="h-43 min-h-0 border-0"
                  />
                </div>
                <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 content-start">
                  <InputWithSuffix
                    label="Surface habitable par logement (moy)"
                    suffix="m²"
                    value={draft.surfaceMoyenne}
                    placeholder="70"
                    onChange={(value) => setDraft((previousDraft) => ({ ...previousDraft, surfaceMoyenne: value }))}
                  />
                  <Input
                    hideOptionalLabel
                    label="Habitants par logement (moy)"
                    nativeInputProps={{
                      inputMode: 'decimal',
                      min: 0,
                      onBlur: () => {
                        setDraft((previousDraft) => ({
                          ...previousDraft,
                          habitantsMoyen: normalizeDecimalString(previousDraft.habitantsMoyen),
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
                  <RichSelect<EspaceExterieur>
                    value={draft.espaceExterieur ?? undefined}
                    onChange={(value) => setDraft((previousDraft) => ({ ...previousDraft, espaceExterieur: value }))}
                    options={[...espaceExterieurOptions]}
                    placeholder={isEspaceExterieurDisabled ? "Renseignez d'abord le mode de chauffage" : 'Cochez vos espaces disponibles'}
                    label="Espaces extérieurs"
                    disabled={isEspaceExterieurDisabled}
                  />
                  <Input
                    hideOptionalLabel
                    label="Nombre de logements"
                    nativeInputProps={{
                      inputMode: 'numeric',
                      min: 1,
                      onChange: (event) => setDraft((previousDraft) => ({ ...previousDraft, nbLogements: event.target.value })),
                      placeholder: '25',
                      type: 'number',
                      value: draft.nbLogements,
                    }}
                  />
                  <div className="md:col-span-2">
                    <DpeField value={draft.dpe} onChange={(value) => setDraft((previousDraft) => ({ ...previousDraft, dpe: value }))} />
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
                    onChange: (event) =>
                      setDraft((previousDraft) => ({
                        ...previousDraft,
                        typeRadiateur: (event.target.value || null) as TypeRadiateur | null,
                      })),
                    value: draft.typeRadiateur ?? undefined,
                  }}
                />
                <Select
                  label="Mode d’eau chaude sanitaire"
                  options={[{ label: 'Non renseigné', value: '' }, ...modeEauChaudeSanitaireOptions]}
                  nativeSelectProps={{
                    onChange: (event) =>
                      setDraft((previousDraft) => ({
                        ...previousDraft,
                        modeEauChaudeSanitaire: (event.target.value || null) as ModeEauChaudeSanitaire | null,
                      })),
                    value: draft.modeEauChaudeSanitaire ?? undefined,
                  }}
                />
              </div>
            </section>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" iconId="fr-icon-save-line" disabled={!isDirty}>
              Enregistrer et recalculer
            </Button>
            <Button priority="secondary" type="button" onClick={handleClose} disabled={!isDirty}>
              Annuler
            </Button>
          </div>
        </>
      ) : (
        <Button
          full
          priority="secondary"
          iconId="fr-icon-pencil-line"
          className="mb-6 md:hidden"
          iconPosition="left"
          aria-expanded={isOpen}
          aria-controls="params-form"
          onClick={() => setIsOpen(true)}
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
          <DpeTag letter={dpeValue} isSelected={value === dpeValue} onClick={() => onChange(dpeValue)} />
        ))}
      </div>
    </div>
  );
}

function InputWithSuffix({
  label,
  onChange,
  placeholder,
  suffix,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix: string;
  value: string;
}) {
  return (
    <div className="relative inline-block w-full">
      <Input
        hideOptionalLabel
        label={label}
        nativeInputProps={{
          inputMode: 'numeric',
          min: 1,
          onChange: (event) => onChange(event.target.value),
          placeholder,
          type: 'number',
          value,
        }}
        className="[&_input]:pr-12"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/3 text-gray-500">{suffix}</span>
    </div>
  );
}
