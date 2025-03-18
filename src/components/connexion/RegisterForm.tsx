import { Stepper } from '@codegouvfr/react-dsfr/Stepper';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { type z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Highlight from '@/components/ui/Highlight';
import Link from '@/components/ui/Link';
import { toastErrors } from '@/services/notification';
import {
  zCredentialsSchema,
  zIdentitySchema,
  zAdditionalInfoSchema,
  type CredentialsSchema,
  type IdentitySchema,
  type AdditionalInfoSchema,
} from '@/services/user';
import { userRolesInscription } from '@/types/enum/UserRole';
import { postFetchJSON } from '@/utils/network';
import { upperCaseFirstChar } from '@/utils/strings';

type FormStep = {
  label: string;
  schema: z.ZodType<any>;
  defaultValues: Record<string, any>;
};

const steps: FormStep[] = [
  {
    label: 'Choisir un identifiant',
    schema: zCredentialsSchema,
    defaultValues: {
      email: '',
      password: '',
      accept_cgu: false,
      optin_newsletter: false,
    } satisfies CredentialsSchema,
  },
  {
    label: 'Votre profil',
    schema: zIdentitySchema,
    defaultValues: {
      first_name: '',
      last_name: '',
      role: 'professionnel',
      structure: '',
      structure_type: '',
      job: '',
      email: '',
      phone: null,
    } satisfies IdentitySchema,
  },
  {
    label: 'Vos besoins',
    schema: zAdditionalInfoSchema,
    defaultValues: {
      besoins: [],
    } satisfies AdditionalInfoSchema,
  },
] as const;

type FormValues = AdditionalInfoSchema & IdentitySchema & CredentialsSchema;

const defaultValues = steps.reduce<FormValues>((acc, curr) => ({ ...acc, ...curr.defaultValues }), {} as FormValues);

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const previousStep = steps[stepIndex - 1];
  const nextStep = steps[stepIndex + 1];
  const [formData, setFormData] = useState(defaultValues);

  const { EmailInput, PasswordInput, Checkbox, Submit, Form, Input, Checkboxes, Radio, useValue, Select, PhoneInput } = useForm({
    defaultValues: formData,
    schema: step.schema,
    onSubmit: toastErrors(async ({ value }) => {
      const newFormData = { ...formData, ...value };
      setFormData(newFormData);

      if (stepIndex < steps.length - 1) {
        setStepIndex(stepIndex + 1);
      } else {
        await postFetchJSON('/api/auth/register', value);
        router.push('/inscription/bravo');
      }
    }),
  });

  const structureType = useValue('structure_type');
  const role = useValue('role');
  return (
    <>
      {stepIndex === 0 && (
        <>
          <span className="block">Connectez-vous pour bénéficier de fonctionnalités avancées :</span>
          <ul className="list-disc pl-4 my-5">
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
            <strong>Vous êtes maître d'ouvrage ou gestionnaire d'un réseau de chaleur ?</strong> Retrouvez l'ensemble des demandes déposées
            à proximité de votre réseau. Pour paramétrer vos accès, merci de <Link href="/contact">nous contacter</Link>.
          </Highlight>
        </>
      )}
      <Stepper currentStep={stepIndex + 1} stepCount={steps.length} title={steps[stepIndex].label} nextTitle={nextStep?.label} />

      <Form>
        <div className="flex flex-col gap-4">
          {stepIndex === 0 && (
            <>
              <EmailInput name="email" label="Email" nativeInputProps={{ placeholder: 'Saisir votre email' }} />
              <PasswordInput name="password" label="Mot de passe" nativeInputProps={{ placeholder: 'Saisir votre mot de passe' }} />
              <Checkbox name="optin_newsletter" small label={<>Je souhaite rester informé des actualités de France Chaleur Urbaine</>} />
              <Checkbox
                name="accept_cgu"
                small
                label={
                  <>
                    J'atteste avoir lu et accepté les&nbsp;
                    <Link href="/mentions-legales" isExternal>
                      conditions générales d'utilisation
                    </Link>
                  </>
                }
              />
            </>
          )}
          {stepIndex === 1 && (
            <>
              <Input name="first_name" label="Prénom" />
              <Input name="last_name" label="Nom de famille" />
              <PhoneInput name="phone" label="Téléphone" />
              <Radio
                name="role"
                label="Vous êtes :"
                options={userRolesInscription.map((role) => ({
                  label: upperCaseFirstChar(role),
                  nativeInputProps: {
                    value: role,
                  },
                }))}
              />
              {role === 'particulier' ? (
                <Alert variant="info" className="mb-5">
                  L'espace connecté est principalement dédié aux professionnels ! L'utilisation du mode avancé du comparateur nécessite une
                  bonne connaissance des contraintes inhérentes à chaque mode de chauffage, qui ne sont pas prises en compte dans les
                  simulations.
                </Alert>
              ) : (
                <>
                  <Input name="structure" label="Structure" />
                  <Select
                    name="structure_type"
                    label="Type de structure"
                    options={[
                      { label: "Bureau d'études", value: 'bureau_etudes' },
                      { label: 'Gestionnaire de réseaux de chaleur', value: 'gestionnaire_reseaux' },
                      { label: 'Collectivité', value: 'collectivite' },
                      { label: 'Syndic de copropriété', value: 'syndic_copropriete' },
                      { label: 'Bailleur social', value: 'bailleur_social' },
                      { label: 'Gestionnaire de parc tertiaire', value: 'gestionnaire_parc_tertiaire' },
                      { label: 'Mandataire / délégataire CEE', value: 'mandataire_cee' },
                      { label: 'Autre (préciser)', value: 'autre' },
                    ]}
                  />
                  {structureType === 'autre' && <Input name="structure_other" label="Renseignez le type de structure" />}
                  <Input name="job" label="Poste" />
                </>
              )}
            </>
          )}
          {stepIndex === 2 && (
            <>
              <Checkboxes
                name="besoins"
                label="Afin d'enrichir l'espace connecté, partagez-nous vos besoins"
                options={[
                  {
                    label: 'Comparer les coûts et émissions de CO2 de modes de chauffage et de refroidissement',
                    nativeInputProps: {
                      value: 'comparer',
                    },
                  },
                  {
                    label: 'Tester des listes d’adresses',
                    nativeInputProps: {
                      value: 'test',
                    },
                  },
                  {
                    label: 'Réaliser des études sur les potentiels de raccordement / développement de réseaux',
                    nativeInputProps: {
                      value: 'potentiel',
                    },
                  },
                  {
                    label: 'Etre notifié en cas d’actualisation de la carte',
                    nativeInputProps: {
                      value: 'actualisation',
                    },
                  },
                  {
                    label: 'Intégrer une communauté de professionnels sur les réseaux de chaleur',
                    nativeInputProps: {
                      value: 'communaute',
                    },
                  },
                  {
                    label: 'Faire connaître mon parc de bâtiments aux collectivités et gestionnaires de réseaux',
                    nativeInputProps: {
                      value: 'presentation',
                    },
                  },
                  {
                    label: 'Autre',
                    nativeInputProps: {
                      value: 'autre',
                    },
                  },
                ]}
              />
            </>
          )}
          <div className="flex justify-between text-sm mb-8 items-center">
            {previousStep ? (
              <Button priority="secondary" onClick={() => setStepIndex(stepIndex - 1)}>
                Précedent
              </Button>
            ) : (
              <Link href={`/connexion?${searchParams.toString()}`}>Se connecter</Link>
            )}
            <Submit>Valider</Submit>
          </div>
        </div>
      </Form>
    </>
  );
}

export default RegisterForm;
