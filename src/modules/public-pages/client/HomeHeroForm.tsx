import { useStore } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { type ReactNode, useEffect, useState } from 'react';

import Radio from '@/components/form/dsfr/Radio';
import Link from '@/components/ui/Link';
import useInitialSearchParam from '@/hooks/useInitialSearchParam';
import { AnalyticsFormId, trackPostHogEvent } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import { OutdoorSpaceCheckboxes } from '@/modules/chaleur-renouvelable/client/OutdoorSpaceCheckboxes';
import { typeLogementOptions, typeRadiateurOptions } from '@/modules/chaleur-renouvelable/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';

import type { HomeFormMode } from '../constants';
import { EligibilityContactModal } from './EligibilityContactModal';
import {
  buildComparatorResultUrl,
  type HomeFormValues,
  heatingTypeToTypeLogement,
  homeFormModeParser,
  parseHeatingParam,
  typeLogementToHeatingType,
  zHomeForm,
  zHomeFormValues,
} from './home-form';
import { useEligibilityTest } from './hooks/useEligibilityTest';
import { useRestoreGeoAddress } from './hooks/useRestoreGeoAddress';

// the DSFR label is a flex column: the text sits in one span so that the bold part stays inline
const MODE_OPTIONS: { hintText: string; label: ReactNode; value: HomeFormMode }[] = [
  {
    hintText: 'Réponse immédiate pour votre adresse',
    label: (
      <span>
        Savoir si je peux me raccorder au <strong>réseau de chaleur urbain</strong>
      </span>
    ),
    value: 'raccordement',
  },
  {
    hintText: 'Réseau de chaleur, solaire, géothermie, bois…',
    label: (
      <span>
        Comparer <strong>toutes les solutions</strong> de chauffage écologique
      </span>
    ),
    value: 'comparateur',
  },
];

// Label and control on one line from the md breakpoint, DSFR stacks them by default
const INLINE_FIELD_CLASSES = 'mb-0! md:flex md:items-center md:gap-3 [&>label]:mb-0! [&>label]:shrink-0 [&>label]:text-lg';

/**
 * Home page address test: one address and housing type, then either the heat network
 * eligibility test (contact modal) or the renewable heating comparator (result page).
 * Honours the partner iframe hand-off (`?address=&heating=` runs the test on load) and
 * the `?mode=` preselection.
 */
export function HomeHeroForm() {
  const router = useRouter();
  const [mode, setMode] = useQueryState('mode', homeFormModeParser);
  const urlHeating = parseHeatingParam(useInitialSearchParam('heating'));
  const urlAddress = useInitialSearchParam('address');
  const { userInfo, setUserInfo } = useUserInfo();
  const eligibilityTest = useEligibilityTest();
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  const defaultValues: HomeFormValues = {
    espaceExterieur: 'none',
    geoAddress: undefined,
    mode,
    typeLogement: heatingTypeToTypeLogement(userInfo.heatingType),
    typeRadiateur: '',
  };
  const form = useAppForm({
    ...schemaValidation(zHomeFormValues),
    defaultValues,
    onSubmit: async ({ value }) => {
      // re-parse through the union: strips the comparator fields when testing the eligibility
      const data = await zHomeForm.parseAsync(value);
      if (data.mode === 'comparateur') {
        trackPostHogEvent('home:simulation_started', {
          address_filled: true,
          emitter_type: data.typeRadiateur,
          heating_mode: data.typeLogement,
          outdoor_space: data.espaceExterieur,
        });
        router.push(buildComparatorResultUrl(data));
        return;
      }
      await eligibilityTest.testEligibility(data.geoAddress, typeLogementToHeatingType(data.typeLogement));
    },
  });

  const geoAddress = useStore(form.store, (state) => state.values.geoAddress);
  const typeLogement = useStore(form.store, (state) => state.values.typeLogement);

  // Partner iframes land here with ?address=&heating=: remember them and run the test right away
  useEffect(() => {
    if (urlHeating || urlAddress) {
      setUserInfo({ ...(urlHeating ? { heatingType: urlHeating } : {}), ...(urlAddress ? { address: urlAddress } : {}) });
    }
    if (urlHeating && urlAddress) {
      setShouldAutoSubmit(true);
    }
  }, [urlHeating, urlAddress, setUserInfo]);

  useRestoreGeoAddress({
    addressLabel: urlAddress ?? userInfo.address,
    geoAddress,
    onRestore: (restoredGeoAddress) => form.setFieldValue('geoAddress', restoredGeoAddress, { dontUpdateMeta: true }),
  });

  // The remembered heating type (local storage, URL) can arrive after the form is mounted
  useEffect(() => {
    const rememberedTypeLogement = heatingTypeToTypeLogement(userInfo.heatingType);
    if (rememberedTypeLogement) {
      form.setFieldValue('typeLogement', rememberedTypeLogement, { dontUpdateMeta: true });
    }
  }, [userInfo.heatingType]);

  // ?mode= is the source of truth (radio, CTA, deep link): the form store only mirrors it.
  // A bound field would echo this programmatic set into setMode and clear the param on load.
  useEffect(() => {
    form.setFieldValue('mode', mode, { dontUpdateMeta: true });
  }, [mode]);

  // Iframe hand-off: submit once the address feature and the housing type are both known
  useEffect(() => {
    if (shouldAutoSubmit && typeLogement && geoAddress) {
      setShouldAutoSubmit(false);
      void form.handleSubmit();
    }
  }, [shouldAutoSubmit, typeLogement, geoAddress]);

  return (
    <>
      <Form form={form} id={AnalyticsFormId.form_test_adresse} className="flex flex-col gap-4">
        <form.AppField name="geoAddress">
          {(field) => (
            <field.AddressSelectField
              label="Mon bâtiment est au"
              className={`${INLINE_FIELD_CLASSES} [&>div]:flex-1`}
              defaultValue={urlAddress ?? userInfo.address}
              nativeInputProps={{ placeholder: 'Tapez votre adresse ici' }}
              onClear={() => setUserInfo({ address: '' })}
              onSelect={(selectedGeoAddress) => {
                setUserInfo({ address: selectedGeoAddress?.properties.label ?? '' });
                trackPostHogEvent('address_test:started', { chauffage_type: userInfo.heatingType, source: 'homepage' });
              }}
            />
          )}
        </form.AppField>
        <div className="flex flex-wrap items-center gap-3 text-lg">
          <form.AppField
            name="typeLogement"
            listeners={{
              onChange: ({ value }) => {
                if (value) {
                  setUserInfo({ heatingType: typeLogementToHeatingType(value) });
                }
              },
            }}
          >
            {(field) => (
              <field.SelectField
                label="C’est un/une"
                hideOptionalLabel
                className={INLINE_FIELD_CLASSES}
                options={[...typeLogementOptions]}
                placeholder="Sélectionnez votre type de bâtiment"
              />
            )}
          </form.AppField>
          <span aria-hidden className="hidden md:inline">
            .
          </span>
        </div>
        <Radio
          label="Je veux…"
          className="mb-0!"
          classes={{
            content: 'grid! gap-4 md:grid-cols-2',
            inputGroup: 'm-0! rounded-lg border border-gray-300 bg-white p-4 has-checked:border-[#000091] has-checked:bg-info-light',
            legend: 'text-lg',
          }}
          options={MODE_OPTIONS.map((option) => ({
            ...option,
            nativeInputProps: {
              checked: mode === option.value,
              name: 'mode',
              onChange: () => {
                void setMode(option.value);
                trackPostHogEvent('home:mode_selected', { mode: option.value });
              },
              value: option.value,
            },
          }))}
        />
        {mode === 'comparateur' && (
          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="typeRadiateur">
              {(field) => (
                <field.SelectField
                  label="Type de radiateurs"
                  className="mb-0!"
                  options={[...typeRadiateurOptions]}
                  placeholder="Indiquez votre type de radiateurs"
                />
              )}
            </form.AppField>
            <form.AppField name="espaceExterieur">
              {(field) => <field.CustomField Component={OutdoorSpaceCheckboxes} layout="stacked" />}
            </form.AppField>
          </div>
        )}
        {eligibilityTest.hasError && (
          <p className="fr-error-text mb-0">
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </p>
        )}
        <div>
          <form.SubmitButton size="medium" iconId="fr-icon-arrow-right-line" iconPosition="right" loading={eligibilityTest.isLoading}>
            Tester cette adresse
          </form.SubmitButton>
        </div>
      </Form>
      <EligibilityContactModal {...eligibilityTest} />
    </>
  );
}
