import Input from '@components/shared/input';
// import RadioGroup from '@components/shared/RadioGroup';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import { Field, useFormikContext } from 'formik';
import { ReactNode } from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';

const InputWraper = styled.div`
  opacity: 1;
  transition:
    opacity 0.25s ease,
    max-height 0.5s ease;

  &.hidden {
    opacity: 0;
    max-height: 0;
  }

  .fr-form-group {
    margin-bottom: 0;
  }
`;

export const fieldLabelInformation = {
  structure: {
    label: 'Type de bâtiment :',
    inputs: [
      { value: 'Copropriété', label: 'Copropriété', id: 'copropriete' },
      { value: 'Tertiaire', label: 'Tertiaire', id: 'tertiaire' },
      {
        value: 'Maison individuelle',
        label: 'Maison individuelle',
        id: 'maison',
      },
      { value: 'Bailleur social', label: 'Bailleur social', id: 'bailleur' },
    ],
  },
  lastName: 'Nom :',
  firstName: 'Prénom :',
  company: 'Établissement',
  email: 'Email :',
  phone: 'Téléphone :',
  heatingEnergy: {
    label: 'Mode de chauffage actuel :',
    inputs: [
      { value: 'électricité', label: 'Électricité', id: 'electricite' },
      { value: 'gaz', label: 'Gaz', id: 'gaz' },
      { value: 'fioul', label: 'Fioul', id: 'fioul' },
      { value: 'autre', label: 'Autre / Je ne sais pas', id: 'autre' },
    ],
  },
};
export const defaultValuesContactInformation = {
  structure: '',
  lastName: '',
  firstName: '',
  company: '',
  email: '',
  heatingEnergy: '',
  phone: '',
};
export const validationSchemasContactInformation = {
  structure: Yup.string().required(
    'Veuillez renseigner votre type de bâtiment'
  ),
  lastName: Yup.string().required('Veuillez renseigner votre nom'),
  firstName: Yup.string().required('Veuillez renseigner votre prénom'),
  company: Yup.string(),
  phone: Yup.string().matches(
    /^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$/,
    'Veuillez renseigner votre numéro de téléphone sous le format 0605040302'
  ),
  email: Yup.string()
    .email('Votre adresse email n‘est pas valide')
    .required('Veuillez renseigner votre adresse email'),
  heatingEnergy: Yup.string()
    .required('Veuillez renseigner votre chauffage')
    .oneOf(
      fieldLabelInformation.heatingEnergy.inputs.map(({ value }) => value),
      'Ce champ est requis'
    ),
};

const ContactInformation = ({
  cardMode,
  city,
  heatingTypeInput,
}: {
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
}) => {
  const { values }: any = useFormikContext();
  return (
    <>
      <fieldset className={`fr-fieldset fr-mt-${cardMode ? '1' : '3'}w`}>
        <InputWraper>
          {/* <RadioGroup
            required
            isInline={!cardMode}
            label={fieldLabelInformation.structure.label}
            name="structure"
            inputs={fieldLabelInformation.structure.inputs}
          /> */}
          {/* FIXME intégrer les erreurs formik */}
          <RadioButtons
            legend={fieldLabelInformation.structure.label}
            name="structure"
            orientation={cardMode ? 'vertical' : 'horizontal'}
            options={fieldLabelInformation.structure.inputs.map(
              ({ value, label, id }) => ({
                label: label,
                nativeInputProps: {
                  id: id,
                  value: value,
                  // FIXME vérifier
                  // checked: value === optionValue,
                  //  onChange: onChange,
                },
              })
            )}
          />
        </InputWraper>
      </fieldset>
      {values.structure === 'Maison individuelle' &&
        city !== 'Charleville-Mézières' && (
          <Alert
            className="fr-mt-2w"
            severity="warning"
            small
            description="Le raccordement des maisons individuelles reste compliqué à ce jour, pour des raisons techniques et économiques. Il est probable que le gestionnaire du réseau ne donne pas suite à votre demande."
          />
        )}
      {heatingTypeInput}
      <fieldset className="fr-fieldset fr-my-1w">
        <InputWraper>
          {/* <RadioGroup
            label={
              heatingTypeInput
                ? 'Énergie de chauffage :'
                : fieldLabelInformation.heatingEnergy.label
            }
            name="heatingEnergy"
            inputs={fieldLabelInformation.heatingEnergy.inputs}
            required
            isInline={!cardMode}
          /> */}
          <RadioButtons
            legend={fieldLabelInformation.heatingEnergy.label}
            name="heatingEnergy"
            orientation={cardMode ? 'vertical' : 'horizontal'}
            options={fieldLabelInformation.heatingEnergy.inputs.map(
              ({ value, label, id }) => ({
                label: label,
                nativeInputProps: {
                  id: id,
                  value: value,
                  // FIXME vérifier
                  // checked: value === optionValue,
                  //  onChange: onChange,
                },
              })
            )}
          />
        </InputWraper>
      </fieldset>
      <fieldset className="fr-fieldset">
        <InputWraper className="fr-my-1w">
          <Field
            name="lastName"
            required
            label={fieldLabelInformation.lastName}
            component={Input}
          />
        </InputWraper>
        <InputWraper className="fr-my-1w">
          <Field
            name="firstName"
            required
            label={fieldLabelInformation.firstName}
            component={Input}
          />
        </InputWraper>
        {values.structure === 'Tertiaire' && (
          <InputWraper className="fr-my-1w">
            <Field
              name="company"
              label={fieldLabelInformation.company}
              component={Input}
              required
            />
          </InputWraper>
        )}
        <InputWraper className="fr-my-1w">
          <Field
            name="email"
            type="email"
            label={fieldLabelInformation.email}
            component={Input}
            required
          />
        </InputWraper>
        <InputWraper className="fr-my-1w without-arrows">
          <Field
            name="phone"
            placeholder="0605040302"
            label={fieldLabelInformation.phone}
            component={Input}
          />
        </InputWraper>
      </fieldset>
    </>
  );
};

export default ContactInformation;
