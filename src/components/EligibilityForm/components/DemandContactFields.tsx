import { fr } from '@codegouvfr/react-dsfr';
import { useStore } from '@tanstack/react-form';
import type { HTMLAttributes } from 'react';
import type { z } from 'zod';

import Alert from '@/components/ui/Alert';
import { fieldLabelInformation, type zBatchDemandContactSchema } from '@/modules/demands/constants';
import { withFieldGroup } from '@/modules/form/useAppForm';
import cx from '@/utils/cx';

export type DemandContactFieldsValues = z.input<typeof zBatchDemandContactSchema>;

const demandContactDefaultValues: DemandContactFieldsValues = {
  commentUser: '',
  company: '',
  companyType: '',
  demandArea: undefined,
  demandCompanyName: '',
  demandCompanyType: '',
  email: '',
  firstName: '',
  lastName: '',
  nbLogements: undefined,
  phone: '',
  structure: '',
};

/** Identity mapping for forms holding the contact fields at the root of their values (see `ContactForm`). */
export const demandContactRootFields = {
  commentUser: 'commentUser',
  company: 'company',
  companyType: 'companyType',
  demandArea: 'demandArea',
  demandCompanyName: 'demandCompanyName',
  demandCompanyType: 'demandCompanyType',
  email: 'email',
  firstName: 'firstName',
  lastName: 'lastName',
  nbLogements: 'nbLogements',
  phone: 'phone',
  structure: 'structure',
} as const;

type DemandContactFieldsProps = {
  cardMode?: boolean;
  city?: string;
  showHouseWarning?: boolean;
  structureClassName?: string;
};

/**
 * Shared demand contact fields (structure, company, identity, demand details) as a
 * TanStack Form field group. Mount with `form` + `fields` (a subtree prefix like
 * `"contact"`, or `demandContactRootFields` for root-level values); conditional
 * sub-fields react to the group's own values.
 */
export const DemandContactFields = withFieldGroup<DemandContactFieldsValues, unknown, DemandContactFieldsProps>({
  defaultValues: demandContactDefaultValues,
  // biome-ignore lint: a named PascalCase function is required for the hooks rules (an inline `render()` method is not seen as a component)
  render: function DemandContactFieldsRender({ group, cardMode, city, showHouseWarning, structureClassName }) {
    // despite the type, `values` is undefined while a group mounted on an optional subtree initializes
    const structure = useStore(group.store, (state) => state.values?.structure);
    const companyType = useStore(group.store, (state) => state.values?.companyType);
    const demandCompanyType = useStore(group.store, (state) => state.values?.demandCompanyType);

    // Tertiaire-only fields must not survive a structure change (mount covers stale persisted values)
    const clearStaleTertiaireFields = (structureValue: string | undefined) => {
      if (structureValue !== 'Tertiaire' && group.getFieldValue('companyType')) {
        // dontUpdateMeta: a programmatic clear must not mark the fields as touched,
        // so they come back pristine (no instant error) if Tertiaire is re-selected
        group.setFieldValue('companyType', '', { dontUpdateMeta: true });
        group.setFieldValue('company', '', { dontUpdateMeta: true });
      }
    };

    return (
      <>
        <group.AppField
          name="structure"
          listeners={{
            onChange: ({ value }) => clearStaleTertiaireFields(value),
            onMount: ({ value }) => clearStaleTertiaireFields(value),
          }}
        >
          {(field) => (
            <field.SelectField
              label={fieldLabelInformation.structure.label}
              className={structureClassName ?? fr.cx(`fr-mt-${cardMode ? '1' : '3'}w`)}
              options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
                label,
                value,
              }))}
            />
          )}
        </group.AppField>
        {showHouseWarning && structure === 'Maison individuelle' && city !== 'Charleville-Mézières' && (
          <Alert className="mb-2w" variant="warning" size="sm">
            Le raccordement des maisons individuelles reste compliqué à ce jour, pour des raisons techniques et économiques. Il est probable
            que le gestionnaire du réseau ne donne pas suite à votre demande.
          </Alert>
        )}
        {structure === 'Tertiaire' && (
          <Fieldset>
            <FieldsetLegend>{fieldLabelInformation.companyTitle}</FieldsetLegend>
            <FieldWrapper>
              <group.AppField name="companyType">
                {(field) => (
                  <field.SelectField
                    label={fieldLabelInformation.companyType.label}
                    options={[...fieldLabelInformation.companyType.inputs]}
                    nativeSelectProps={{
                      required: true,
                    }}
                  />
                )}
              </group.AppField>
            </FieldWrapper>
            <FieldWrapper>
              <group.AppField name="company">
                {/* only rendered for Tertiaire, where the schema superRefine makes it required */}
                {(field) => <field.TextField label={fieldLabelInformation.company} nativeInputProps={{ required: true }} />}
              </group.AppField>
            </FieldWrapper>
          </Fieldset>
        )}
        <Fieldset>
          <FieldsetLegend>{fieldLabelInformation.contactDetailsTitle}</FieldsetLegend>
          <FieldWrapper>
            <group.AppField name="lastName">{(field) => <field.TextField label={fieldLabelInformation.lastName} />}</group.AppField>
          </FieldWrapper>
          <FieldWrapper>
            <group.AppField name="firstName">{(field) => <field.TextField label={fieldLabelInformation.firstName} />}</group.AppField>
          </FieldWrapper>
          <FieldWrapper>
            <group.AppField name="email">{(field) => <field.EmailField label={fieldLabelInformation.email} />}</group.AppField>
          </FieldWrapper>
          <FieldWrapper>
            <group.AppField name="phone">{(field) => <field.PhoneField label={fieldLabelInformation.phone} />}</group.AppField>
          </FieldWrapper>
        </Fieldset>
        {(structure === 'Copropriété' || (structure === 'Tertiaire' && companyType !== 'Autre')) && (
          <Fieldset>
            {structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') && (
              <>
                <FieldWrapper>
                  <group.AppField name="demandCompanyType">
                    {/* only rendered for companyTypes where the schema superRefine makes it required */}
                    {(field) => (
                      <field.SelectField
                        label={fieldLabelInformation.demandCompanyType.label}
                        options={[...fieldLabelInformation.demandCompanyType.inputs]}
                        nativeSelectProps={{ required: true }}
                      />
                    )}
                  </group.AppField>
                </FieldWrapper>
                {(demandCompanyType === 'Bâtiment tertiaire' ||
                  demandCompanyType === 'Bailleur social' ||
                  demandCompanyType === 'Autre') && (
                  <FieldWrapper>
                    <group.AppField name="demandCompanyName">
                      {/* only rendered for demandCompanyTypes where the schema superRefine makes it required */}
                      {(field) => <field.TextField label={fieldLabelInformation.demandCompanyName} nativeInputProps={{ required: true }} />}
                    </group.AppField>
                  </FieldWrapper>
                )}
              </>
            )}
            {structure === 'Tertiaire' &&
              (companyType === 'Gestionnaire de parc tertiaire' || demandCompanyType === 'Bâtiment tertiaire') && (
                <FieldWrapper>
                  <group.AppField name="demandArea">
                    {(field) => <field.NumberField label={fieldLabelInformation.demandArea} />}
                  </group.AppField>
                </FieldWrapper>
              )}
            {(structure === 'Copropriété' ||
              (structure === 'Tertiaire' &&
                (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
                (demandCompanyType === 'Copropriété' || demandCompanyType === 'Bailleur social')) ||
              (structure === 'Tertiaire' && (companyType === 'Syndic de copropriété' || companyType === 'Bailleur social'))) && (
              <FieldWrapper>
                <group.AppField name="nbLogements">
                  {(field) => <field.NumberField label={fieldLabelInformation.nbLogements} />}
                </group.AppField>
              </FieldWrapper>
            )}
          </Fieldset>
        )}
        <group.AppField name="commentUser">
          {(field) => <field.TextareaField label={fieldLabelInformation.commentUser} nativeTextAreaProps={{ rows: 4 }} />}
        </group.AppField>
      </>
    );
  },
});

export default DemandContactFields;

type FieldsetProps = HTMLAttributes<HTMLFieldSetElement>;

function Fieldset({ children, className, ...props }: FieldsetProps) {
  return (
    <fieldset className={cx('fr-fieldset', className)} {...props}>
      {children}
    </fieldset>
  );
}

type FieldsetLegendProps = HTMLAttributes<HTMLLegendElement>;

function FieldsetLegend({ children, className, ...props }: FieldsetLegendProps) {
  return (
    <legend className={cx('ml-2 mb-1w text-sm font-bold uppercase', className)} {...props}>
      {children}
    </legend>
  );
}

type FieldWrapperProps = HTMLAttributes<HTMLDivElement>;

function FieldWrapper({ children, className, ...props }: FieldWrapperProps) {
  return (
    <div className={cx('fr-fieldset__element', className)} {...props}>
      {children}
    </div>
  );
}
