import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { Field, useFormikContext } from 'formik';
import { ReactNode, useState } from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';

import Input from '@components/form/formik/input';
import Box from '@components/ui/Box';
import Text from '@components/ui/Text';

const InputWraper = styled(Box)`
  opacity: 1;
  transition:
    opacity 0.25s ease,
    max-height 0.5s ease;

  &.hidden {
    opacity: 0;
    max-height: 0;
  }

  // override fr-fieldset__element
  && {
    margin-bottom: 0;
  }

  .heatingEnergyContactInformations .fr-fieldset__legend {
    font-weight: bold !important;
    padding-left: 0px;
    margin-left: 0px;
  }
`;

export const fieldLabelInformation = {
  structure: {
    label: 'Vous êtes...',
    inputs: [
      { value: 'Copropriété', label: 'Copropriétaire', id: 'copropriete' },
      {
        value: 'Maison individuelle',
        label: 'Propriétaire de maison individuelle',
        id: 'maison',
      },
      { value: 'Tertiaire', label: 'Professionnel', id: 'tertiaire' },
    ],
  },
  companyTitle: 'Votre structure',
  company: 'Nom de votre structure',
  companyType: {
    label: 'Type de structure',
    inputs: [
      { value: 'Syndic de copropriété', label: 'Syndic de copropriété', id: 'syndic' },
      { value: 'Bailleur social', label: 'Bailleur social', id: 'bailleur' },
      { value: 'Gestionnaire de parc tertiaire', label: 'Gestionnaire de parc tertiaire', id: 'gestionnaire' },
      { value: "Bureau d'études ou AMO", label: "Bureau d'études ou AMO", id: 'bureau' },
      { value: 'Mandataire / délégataire CEE', label: 'Mandataire / délégataire CEE', id: 'mandataire' },
      { value: 'Autre', label: 'Autre', id: 'autre' },
    ],
  },
  contactDetailsTitle: 'Vos coordonnées',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  phone: 'Téléphone (optionnel)',
  nbLogements: 'Nombre de logements (optionnel)',
  demandCompanyType: {
    label: 'Votre demande concerne',
    inputs: [
      { value: 'Copropriété', label: 'une copropriété', id: 'copro' },
      { value: 'Maison individuelle', label: 'une maison individuelle', id: 'maison' },
      { value: 'Bâtiment tertiaire', label: 'un bâtiment tertiaire', id: 'batiment' },
      { value: 'Bailleur social', label: 'un bailleur social', id: 'bailleur' },
      { value: 'Autre', label: 'autre', id: 'autre' },
    ],
  },
  demandCompanyName: 'Nom de la structure accompagnée',
  demandArea: 'Surface en m2 (optionnel)',
  heatingEnergy: {
    label: 'Mode de chauffage',
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
  companyType: '',
  email: '',
  phone: '',
  nbLogements: undefined,
  demandCompanyType: '',
  demandCompanyName: '',
  demandArea: undefined,
  heatingEnergy: '',
};
export const validationSchemasContactInformation = {
  structure: Yup.string().required('Veuillez renseigner votre type de bâtiment'),
  lastName: Yup.string().required('Veuillez renseigner votre nom'),
  firstName: Yup.string().required('Veuillez renseigner votre prénom'),
  company: Yup.string(),
  companyType: Yup.string(),
  phone: Yup.string().matches(
    /^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$/,
    'Veuillez renseigner votre numéro de téléphone sous le format 0605040302'
  ),
  email: Yup.string().email('Votre adresse email n‘est pas valide').required('Veuillez renseigner votre adresse email'),
  heatingEnergy: Yup.string()
    .required('Veuillez renseigner votre chauffage')
    .oneOf(
      fieldLabelInformation.heatingEnergy.inputs.map(({ value }) => value),
      'Ce champ est requis'
    ),
  nbLogements: Yup.number(),
  demandCompanyType: Yup.string(),
  demandCompanyName: Yup.string(),
  demandArea: Yup.number(),
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
  const [companyType, setCompanyType] = useState('');
  const [demandCompanyType, setDemandCompanyType] = useState('');

  const setCompanyTypeValue = (value: any) => {
    setCompanyType(value);
    values.companyType = value;
  };
  const setDemandCompanyTypeValue = (value: any) => {
    setDemandCompanyType(value);
    values.demandCompanyType = value;
  };
  return (
    <>
      <Field required>
        {({ field }: any) => (
          <RadioButtons
            legend={fieldLabelInformation.structure.label}
            name="structure"
            className={fr.cx(`fr-mt-${cardMode ? '1' : '3'}w`)}
            orientation={cardMode ? 'vertical' : 'horizontal'}
            options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
              label: label,
              nativeInputProps: {
                value: value,
                onChange: field.onChange,
              },
            }))}
          />
        )}
      </Field>
      {values.structure === 'Maison individuelle' && city !== 'Charleville-Mézières' && (
        <Alert
          className={fr.cx('fr-mt-2w')}
          severity="warning"
          small
          description="Le raccordement des maisons individuelles reste compliqué à ce jour, pour des raisons techniques et économiques. Il est probable que le gestionnaire du réseau ne donne pas suite à votre demande."
        />
      )}
      {values.structure === 'Tertiaire' && (
        <fieldset className={fr.cx('fr-fieldset')}>
          <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
            <Text mb="1w" fontSize="14px" fontWeight="bold">
              {fieldLabelInformation.companyTitle}
            </Text>
          </InputWraper>
          <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
            <Select
              label={fieldLabelInformation.companyType.label}
              options={fieldLabelInformation.companyType.inputs}
              nativeSelectProps={{
                required: true,
                onChange: (e) => setCompanyTypeValue(e.target.value),
              }}
            ></Select>
          </InputWraper>
          <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
            <Field name="company" label={fieldLabelInformation.company} component={Input} required />
          </InputWraper>
        </fieldset>
      )}
      <fieldset className={fr.cx('fr-fieldset')}>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Text mb="1w" fontSize="14px" fontWeight="bold">
            {fieldLabelInformation.contactDetailsTitle}
          </Text>
        </InputWraper>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="lastName" required label={fieldLabelInformation.lastName} component={Input} />
        </InputWraper>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="firstName" required label={fieldLabelInformation.firstName} component={Input} />
        </InputWraper>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="email" type="email" label={fieldLabelInformation.email} component={Input} required />
        </InputWraper>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="phone" placeholder="0605040302" label={fieldLabelInformation.phone} component={Input} />
        </InputWraper>
      </fieldset>

      {(values.structure === 'Copropriété' || (values.structure === 'Tertiaire' && companyType !== 'Autre')) && (
        <fieldset className={fr.cx('fr-fieldset')}>
          {values.structure === 'Tertiaire' &&
            (companyType === "Bureau d'études ou AMO" ||
              companyType === 'Mandataire / délégataire CEE' ||
              companyType === 'Gestionnaire de parc tertiaire') && (
              <>
                <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
                  <Select
                    label={fieldLabelInformation.demandCompanyType.label}
                    options={fieldLabelInformation.demandCompanyType.inputs}
                    nativeSelectProps={{
                      required: true,
                      onChange: (e) => setDemandCompanyTypeValue(e.target.value),
                    }}
                  ></Select>
                </InputWraper>
                {(demandCompanyType === 'Bâtiment tertiaire' ||
                  demandCompanyType === 'Bailleur social' ||
                  demandCompanyType === 'Autre') && (
                  <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
                    <Field name="demandCompanyName" label={fieldLabelInformation.demandCompanyName} component={Input} />
                  </InputWraper>
                )}
              </>
            )}
          {values.structure === 'Tertiaire' && companyType === 'Gestionnaire de parc tertiaire' && (
            <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
              <Field name="demandArea" type="number" label={fieldLabelInformation.demandArea} component={Input} />
            </InputWraper>
          )}
          {(values.structure === 'Copropriété' ||
            (values.structure === 'Tertiaire' && (companyType === 'Syndic de copropriété' || companyType === 'Bailleur social'))) && (
            <InputWraper className={fr.cx('fr-fieldset__element')} mb="1w">
              <Field name="nbLogements" type="number" label={fieldLabelInformation.nbLogements} component={Input} />
            </InputWraper>
          )}
        </fieldset>
      )}
      <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
        {heatingTypeInput}
        <Field required>
          {({ field }: any) => (
            <RadioButtons
              legend={heatingTypeInput ? 'Énergie de chauffage :' : fieldLabelInformation.heatingEnergy.label}
              name="heatingEnergy"
              className="heatingEnergyContactInformations"
              orientation={cardMode ? 'vertical' : 'horizontal'}
              options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
                label: label,
                nativeInputProps: {
                  value: value,
                  onChange: field.onChange,
                },
              }))}
            />
          )}
        </Field>
      </InputWraper>
    </>
  );
};

export default ContactInformation;
