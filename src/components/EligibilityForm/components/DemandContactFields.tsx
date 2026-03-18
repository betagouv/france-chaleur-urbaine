import { fr } from '@codegouvfr/react-dsfr';
import { type ComponentType, type HTMLAttributes, type ReactNode, useEffect } from 'react';

import Alert from '@/components/ui/Alert';
import { fieldLabelInformation } from '@/modules/demands/constants';

export type ContactState = {
  companyType?: string;
  demandCompanyType?: string;
  structure?: string;
};

export type FormUi = {
  Field: {
    EmailInput: ComponentType<any>;
    Input: ComponentType<any>;
    NumberInput: ComponentType<any>;
    PhoneInput: ComponentType<any>;
    Select: ComponentType<any>;
  };
  FieldWrapper: ComponentType<HTMLAttributes<HTMLDivElement>>;
  Fieldset: ComponentType<HTMLAttributes<HTMLFieldSetElement>>;
  FieldsetLegend: ComponentType<HTMLAttributes<HTMLLegendElement>>;
  form: {
    setFieldValue: (...args: any[]) => void;
  };
};

type DemandContactFieldsProps = {
  cardMode?: boolean;
  city?: string;
  contactState: ContactState;
  formUi: FormUi;
  heatingTypeInput?: ReactNode;
  namePrefix?: '' | 'contact.';
  showHeatingEnergy?: boolean;
  showHouseWarning?: boolean;
  structureClassName?: string;
};

export const DemandContactFields = ({
  cardMode,
  city,
  contactState,
  formUi,
  heatingTypeInput,
  namePrefix = '',
  showHeatingEnergy = false,
  showHouseWarning = false,
  structureClassName,
}: DemandContactFieldsProps) => {
  const { companyType, demandCompanyType, structure } = contactState;
  const { Field, Fieldset, FieldsetLegend, FieldWrapper, form } = formUi;
  const fieldName = (name: string) => `${namePrefix}${name}`;

  useEffect(() => {
    if (structure !== 'Tertiaire' && companyType) {
      form.setFieldValue(fieldName('companyType'), '');
      form.setFieldValue(fieldName('company'), '');
    }
  }, [companyType, form, structure]);

  return (
    <>
      <Field.Select
        label={fieldLabelInformation.structure.label}
        name={fieldName('structure')}
        className={structureClassName ?? fr.cx(`fr-mt-${cardMode ? '1' : '3'}w`)}
        options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
          label,
          value,
        }))}
      />
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
            <Field.Select
              name={fieldName('companyType')}
              label={fieldLabelInformation.companyType.label}
              options={fieldLabelInformation.companyType.inputs}
              nativeSelectProps={{
                required: true,
              }}
            />
          </FieldWrapper>
          <FieldWrapper>
            <Field.Input name={fieldName('company')} hideOptionalLabel label={fieldLabelInformation.company} />
          </FieldWrapper>
        </Fieldset>
      )}
      <Fieldset>
        <FieldsetLegend>{fieldLabelInformation.contactDetailsTitle}</FieldsetLegend>
        <FieldWrapper>
          <Field.Input name={fieldName('lastName')} label={fieldLabelInformation.lastName} />
        </FieldWrapper>
        <FieldWrapper>
          <Field.Input name={fieldName('firstName')} label={fieldLabelInformation.firstName} />
        </FieldWrapper>
        <FieldWrapper>
          <Field.EmailInput name={fieldName('email')} label={fieldLabelInformation.email} />
        </FieldWrapper>
        <FieldWrapper>
          <Field.PhoneInput name={fieldName('phone')} label={fieldLabelInformation.phone} />
        </FieldWrapper>
      </Fieldset>
      {(structure === 'Copropriété' || (structure === 'Tertiaire' && companyType !== 'Autre')) && (
        <Fieldset>
          {structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') && (
            <>
              <FieldWrapper>
                <Field.Select
                  name={fieldName('demandCompanyType')}
                  label={fieldLabelInformation.demandCompanyType.label}
                  options={fieldLabelInformation.demandCompanyType.inputs}
                />
              </FieldWrapper>
              {(demandCompanyType === 'Bâtiment tertiaire' || demandCompanyType === 'Bailleur social' || demandCompanyType === 'Autre') && (
                <FieldWrapper>
                  <Field.Input name={fieldName('demandCompanyName')} hideOptionalLabel label={fieldLabelInformation.demandCompanyName} />
                </FieldWrapper>
              )}
            </>
          )}
          {structure === 'Tertiaire' &&
            (companyType === 'Gestionnaire de parc tertiaire' || demandCompanyType === 'Bâtiment tertiaire') && (
              <FieldWrapper>
                <Field.NumberInput name={fieldName('demandArea')} label={fieldLabelInformation.demandArea} />
              </FieldWrapper>
            )}
          {(structure === 'Copropriété' ||
            (structure === 'Tertiaire' &&
              (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
              (demandCompanyType === 'Copropriété' || demandCompanyType === 'Bailleur social')) ||
            (structure === 'Tertiaire' && (companyType === 'Syndic de copropriété' || companyType === 'Bailleur social'))) && (
            <FieldWrapper>
              <Field.NumberInput name={fieldName('nbLogements')} label={fieldLabelInformation.nbLogements} />
            </FieldWrapper>
          )}
        </Fieldset>
      )}
      {showHeatingEnergy && (
        <>
          <FieldWrapper>{heatingTypeInput}</FieldWrapper>
          <Field.Select
            label={heatingTypeInput ? 'Énergie de chauffage :' : fieldLabelInformation.heatingEnergy.label}
            name={fieldName('heatingEnergy')}
            className="heatingEnergyContactInformations"
            options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
              label,
              value,
            }))}
          />
        </>
      )}
    </>
  );
};

export default DemandContactFields;
export type { ContactState, FormUi };
