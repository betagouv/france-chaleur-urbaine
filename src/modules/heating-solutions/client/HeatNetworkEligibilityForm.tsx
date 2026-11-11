import { z } from 'zod';

import { zEligibilityTest } from '@/components/EligibilityForm/eligibilityTestValidation';
import Link from '@/components/ui/Link';
import { AnalyticsFormId } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { EligibilityContactModal } from '@/modules/public-pages/client/EligibilityContactModal';
import { useEligibilityTest } from '@/modules/public-pages/client/hooks/useEligibilityTest';

const zHeatNetworkEligibility = zEligibilityTest.extend({
  geoAddress: zEligibilityTest.shape.geoAddress.optional().pipe(zEligibilityTest.shape.geoAddress),
  heatingType: zEligibilityTest.shape.heatingType.pipe(z.enum(['collectif', 'individuel'])),
});

/**
 * Tests an address directly from the heat-network article and opens the shared contact flow.
 */
export function HeatNetworkEligibilityForm() {
  const eligibilityTest = useEligibilityTest();
  const defaultValues: z.input<typeof zHeatNetworkEligibility> = { geoAddress: undefined, heatingType: '' };
  const form = useAppForm({
    ...schemaValidation(zHeatNetworkEligibility),
    defaultValues,
    onSubmit: async ({ value }) => {
      const data = zHeatNetworkEligibility.parse(value);
      await eligibilityTest.testEligibility(data.geoAddress, data.heatingType);
    },
  });

  return (
    <div className="mb-6 print:hidden">
      <Form form={form} id={AnalyticsFormId.form_test_adresse} className="flex flex-col gap-4">
        <form.AppField name="heatingType">
          {(field) => (
            <field.SelectField
              label="Mode de chauffage actuel"
              className="mb-0!"
              placeholder="Sélectionnez votre mode de chauffage"
              options={[
                { label: 'Collectif', value: 'collectif' },
                { label: 'Individuel', value: 'individuel' },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="geoAddress">
          {(field) => (
            <field.AddressSelectField
              label="Adresse du bâtiment"
              className="mb-0!"
              nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
              onSelect={() => {}}
            />
          )}
        </form.AppField>
        {eligibilityTest.hasError && (
          <p className="fr-error-text mb-0" role="alert">
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </p>
        )}
        <div>
          <form.SubmitButton loading={eligibilityTest.isLoading}>Tester mon adresse</form.SubmitButton>
        </div>
      </Form>
      <EligibilityContactModal {...eligibilityTest} />
    </div>
  );
}
