import { useStore } from '@tanstack/react-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { z } from 'zod';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Highlight from '@/components/ui/Highlight';
import Link from '@/components/ui/Link';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { EntrepriseField } from '@/modules/form/EntrepriseField';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import { structureTypesFormLabels, zCredentialsSchema, zIdentitySchema } from '@/modules/users/constants';
import { userRolesInscription } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';
import { ObjectEntries } from '@/utils/typescript';

type CredentialsValues = z.input<typeof zCredentialsSchema>;
type IdentityValues = z.input<typeof zIdentitySchema>;

const credentialsDefaultValues: CredentialsValues = {
  accept_cgu: false,
  email: '',
  optin_newsletter: false,
  password: '',
};

const identityDefaultValues: Omit<IdentityValues, 'email'> = {
  entreprise: null,
  first_name: '',
  last_name: '',
  phone: null,
  role: 'professionnel',
  structure_name: '',
  structure_other: '',
  structure_type: undefined,
};

/**
 * Two-step registration: credentials (email/password/CGU) then identity/profile.
 * Each step is its own form with its own schema; values are accumulated here.
 */
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stepIndex, setStepIndex] = useState(0);
  const [credentials, setCredentials] = useState(credentialsDefaultValues);
  const [identity, setIdentity] = useState(identityDefaultValues);

  return stepIndex === 0 ? (
    <CredentialsStep
      connexionHref={`/connexion?${searchParams?.toString() ?? ''}`}
      defaultValues={credentials}
      onSubmit={(values) => {
        setCredentials(values);
        setStepIndex(1);
      }}
    />
  ) : (
    <IdentityStep
      defaultValues={{ ...identity, email: credentials.email }}
      onBack={(values) => {
        setIdentity(values);
        setStepIndex(0);
      }}
      onSubmit={toastErrors(async (values) => {
        trackPostHogEvent('account:created');
        await postFetchJSON('/api/auth/register', { ...credentials, ...values });
        router.push('/inscription/bravo');
      })}
    />
  );
}

export default RegisterForm;

type CredentialsStepProps = {
  connexionHref: string;
  defaultValues: CredentialsValues;
  onSubmit: (values: CredentialsValues) => void;
};

/**
 * First registration step: account benefits pitch, email, password, newsletter and CGU.
 */
function CredentialsStep({ connexionHref, defaultValues, onSubmit }: CredentialsStepProps) {
  const form = useAppForm({
    ...schemaValidation(zCredentialsSchema),
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <>
      <span className="block text-sm">Connectez-vous pour bénéficier de fonctionnalités avancées :</span>
      <ul className="list-disc pl-4 my-5 text-sm">
        <li>
          <strong>Comparez</strong> les <strong>coûts et émissions de CO2</strong> des différents systèmes de chauffage et de
          refroidissement (réseaux de chaleur et de froid, gaz, fioul, biomasse, PAC...) - mode avancé du comparateur
        </li>
        <li>
          Testez instantanément la <strong>proximité à un réseau de chaleur</strong> d'un grand nombre d'adresses
        </li>
        {/* <br />- Envoyez des <strong>demandes d'informations groupées</strong> TODO à remettre quand la fonctionnalité sera dispo */}
      </ul>
      <Highlight variant="blue" size="sm" className="my-5">
        <strong>Vous êtes maître d'ouvrage ou gestionnaire d'un réseau de chaleur ?</strong> Retrouvez l'ensemble des demandes déposées à
        proximité de votre réseau. Pour paramétrer vos accès, merci de <Link href="/contact">nous contacter</Link>.
      </Highlight>
      <Form form={form}>
        <div className="flex flex-col gap-4">
          <form.AppField name="email">
            {(field) => <field.EmailField label="Email" nativeInputProps={{ placeholder: 'Saisir votre email' }} />}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.PasswordField
                label="Mot de passe"
                nativeInputProps={{ autoComplete: 'new-password', placeholder: 'Saisir votre mot de passe' }}
              />
            )}
          </form.AppField>
          <form.AppField name="optin_newsletter">
            {(field) => <field.CheckboxField label={<>Je souhaite recevoir la newsletter trimestrielle de France Chaleur Urbaine</>} />}
          </form.AppField>
          <form.AppField name="accept_cgu">
            {(field) => (
              <field.CheckboxField
                label={
                  <>
                    J'atteste avoir lu et accepté les&nbsp;
                    <Link href="/mentions-legales" isExternal>
                      conditions générales d'utilisation
                    </Link>
                  </>
                }
              />
            )}
          </form.AppField>
          <div className="flex justify-between text-sm mb-8 items-center">
            <Button priority="tertiary" href={connexionHref}>
              Se connecter
            </Button>
            <form.SubmitButton>Valider</form.SubmitButton>
          </div>
        </div>
      </Form>
    </>
  );
}

const structureTypeOptions = ObjectEntries(structureTypesFormLabels).map(([key, label]) => ({ label, value: key }));

const roleOptions = userRolesInscription.map((role) => ({
  label: upperCaseFirstChar(role),
  nativeInputProps: {
    value: role,
  },
}));

type IdentityStepProps = {
  defaultValues: IdentityValues;
  onBack: (values: IdentityValues) => void;
  onSubmit: (values: IdentityValues) => void;
};

/**
 * Second registration step: identity, role and structure (professionals only).
 * `onBack` receives the current values so edits survive a round-trip to step one.
 */
function IdentityStep({ defaultValues, onBack, onSubmit }: IdentityStepProps) {
  const form = useAppForm({
    ...schemaValidation(zIdentitySchema),
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
  });

  const role = useStore(form.store, (state) => state.values.role);
  const structureType = useStore(form.store, (state) => state.values.structure_type);

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <form.AppField name="first_name">{(field) => <field.TextField label="Prénom" />}</form.AppField>
        <form.AppField name="last_name">{(field) => <field.TextField label="Nom de famille" />}</form.AppField>
        <form.AppField name="phone">{(field) => <field.PhoneField label="Téléphone" />}</form.AppField>
        <form.AppField name="role">{(field) => <field.RadioField label="Vous êtes :" options={roleOptions} />}</form.AppField>
        {role === 'particulier' ? (
          <Alert variant="info" className="mb-5">
            L'espace connecté est principalement dédié aux professionnels ! L'utilisation du mode avancé du comparateur nécessite une bonne
            connaissance des contraintes inhérentes à chaque mode de chauffage, qui ne sont pas prises en compte dans les simulations.
          </Alert>
        ) : (
          <>
            <form.AppField name="structure_type">
              {/* only rendered for non-particulier roles, where the schema refine makes it required */}
              {(field) => (
                <field.SelectField label="Type de structure" options={structureTypeOptions} nativeSelectProps={{ required: true }} />
              )}
            </form.AppField>
            {structureType === 'autre' && (
              <form.AppField name="structure_other">
                {/* only rendered when "autre" is selected, where the schema refine makes it required */}
                {(field) => <field.TextField label="Renseignez le type de structure" nativeInputProps={{ required: true }} />}
              </form.AppField>
            )}
            <form.AppField name="structure_name">
              {(field) => <field.TextField label="Nom de la structure" hideOptionalLabel />}
            </form.AppField>
            <form.AppField name="entreprise">
              {(field) => <field.CustomField Component={EntrepriseField} label="Entreprise" />}
            </form.AppField>
          </>
        )}
        <div className="flex justify-between text-sm mb-8 items-center">
          <Button priority="secondary" onClick={() => onBack(form.state.values)}>
            Précedent
          </Button>
          <form.SubmitButton>Valider</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
}
