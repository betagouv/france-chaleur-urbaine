import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { clientConfig } from '@/client-config';
import NetworkSearchInput from '@/components/Network/NetworkSearchInput';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import type { NetworkSearchResult } from '@/pages/api/networks/search';
import { postFetchJSON, postFormDataFetchJSON } from '@/utils/network';

const maxFileSize = 5 * 1024 * 1024;

const zModificationReseauForm = z.object({
  email: z.email("L'adresse email n'est pas valide"),
  fichiers: z
    .array(z.instanceof(File))
    .max(3, 'Vous ne pouvez déposer que 3 fichiers maximum.')
    .refine((files) => files.every((file) => file.type === 'application/pdf'), { error: 'Seuls les fichiers PDF sont autorisés.' })
    .refine((files) => files.every((file) => file.size <= maxFileSize), {
      error: 'Chaque fichier doit être inférieur à la taille maximale autorisée (5 Mo).',
    })
    .optional(),
  fonction: z.string().min(1, 'Ce champ est obligatoire'),
  gestionnaire: z.string().min(1, 'Ce champ est obligatoire'),
  idReseau: z.string().min(1, 'Ce champ est obligatoire'),
  informationsComplementaires: z.string().max(clientConfig.networkInfoFieldMaxCharacters).optional(),
  maitreOuvrage: z.string().min(1, 'Ce champ est obligatoire'),
  nom: z.string().min(1, 'Ce champ est obligatoire'),
  prenom: z.string().min(1, 'Ce champ est obligatoire'),
  reseauClasse: z.boolean({ error: 'Ce choix est obligatoire' }),
  siteInternet: z.string().optional(),
  structure: z.string().min(1, 'Ce champ est obligatoire'),
  type: z.enum(['collectivite', 'exploitant'], { error: 'Ce choix est obligatoire' }),
});

type ModificationReseauFormValues = z.input<typeof zModificationReseauForm>;

const defaultValues: ModificationReseauFormValues = {
  email: '',
  fichiers: [],
  fonction: '',
  gestionnaire: '',
  idReseau: '',
  informationsComplementaires: '',
  maitreOuvrage: '',
  nom: '',
  prenom: '',
  // required choices without a preselected option (see the module AGENTS.md pattern)
  reseauClasse: undefined as unknown as boolean,
  siteInternet: '',
  structure: '',
  type: undefined as unknown as 'collectivite' | 'exploitant',
};

function ModifierReseauxPage() {
  const router = useRouter();
  const [formSent, setFormSent] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkSearchResult | null>(null);

  const form = useAppForm({
    ...schemaValidation(zModificationReseauForm),
    defaultValues,
    onSubmit: toastErrors(
      async ({ value }) => {
        await postFormDataFetchJSON('/api/modification-reseau', value);
        setFormSent(true);
      },
      () => (
        <span>
          Une erreur est survenue. Veuillez <Link href="/contact">nous contacter</Link>.
        </span>
      )
    ),
  });

  const onNetworkSelect = (network: NetworkSearchResult | null) => {
    setSelectedNetwork(network);
    if (!network) {
      return;
    }

    form.setFieldValue('idReseau', `${network['Identifiant reseau']} - ${network.nom_reseau}`, { dontUpdateMeta: true });
    form.setFieldValue('reseauClasse', network['reseaux classes'] ?? false, { dontUpdateMeta: true });
    form.setFieldValue('maitreOuvrage', network.MO ?? '', { dontUpdateMeta: true });
    form.setFieldValue('gestionnaire', network.Gestionnaire ?? '', { dontUpdateMeta: true });
    form.setFieldValue('siteInternet', network.website_gestionnaire ?? '', { dontUpdateMeta: true });
    form.setFieldValue('informationsComplementaires', network.informationsComplementaires ?? '', { dontUpdateMeta: true });
  };

  // automatically fill the network when coming from another link
  useEffect(() => {
    const reseau = router.query.reseau;
    if (!router.isReady || typeof reseau !== 'string') {
      return;
    }
    form.setFieldValue('idReseau', reseau, { dontUpdateMeta: true });
    void (async () => {
      const [network] = await postFetchJSON<NetworkSearchResult[]>('/api/networks/search', {
        search: reseau,
      });
      if (!network) {
        return;
      }
      onNetworkSelect(network);
      // download existing files as if they were uploaded by the user
      if (Array.isArray(network.fichiers)) {
        const existingFiles = (
          await Promise.all(
            network.fichiers.map(
              async (fichier) =>
                await createFileFromURL(`/api/networks/${network['Identifiant reseau']}/files/${fichier.id}`, fichier.filename)
            )
          )
        ).filter((file): file is File => file !== null);

        form.setFieldValue('fichiers', existingFiles, { dontUpdateMeta: true });
      }
    })();
  }, [router.isReady, router.query.reseau]);

  return (
    <SimplePage
      title="Modifier la fiche d'un réseau sur France Chaleur Urbaine"
      description="Complétez les informations disponibles pour faire connaître votre réseau de chaleur."
      currentPage="/ressources/outils"
    >
      <Box py="4w" className="fr-container">
        <Heading as="h1" size="h3" color="blue-france">
          Complétez les informations qui apparaissent sur la fiche de votre réseau
        </Heading>

        <Text>Sur les fiches par réseau, dans un souci d'homogénéité, seules sont diffusées par France Chaleur Urbaine&nbsp;:</Text>
        <ul>
          <li>
            les données issues de la dernière enquête réalisée par la FEDENE Réseaux de chaleur & froid pour le compte du ministère de la
            transition énergétique&nbsp;;
          </li>
          <li>les données réglementaires de l'arrêté "DPE".</li>
        </ul>
        <Text mt="2w">
          Il vous est toutefois donné la possibilité de compléter ces éléments par toute information qui vous semblerait utile (verdissement
          ou développement en cours ou actés, capacité de raccordement du réseau, puissance minimale requise,...). Vos compléments
          apparaîtront sur la fiche dans un encadré intitulé "Informations complémentaires fournies par la collectivité ou l'exploitant du
          réseau".
        </Text>
        <Text mt="2w" mb="6w">
          Vous avez également la possibilité de télécharger jusqu'à 3 documents PDF que vous jugez utiles à porter à la connaissance des
          usagers de France chaleur Urbaine. Nous vous encourageons notamment à déposer le schéma directeur du réseau, qui nous est souvent
          demandé.
        </Text>

        {formSent ? (
          <Alert
            severity="success"
            title="Merci pour votre contribution"
            description="Nous reviendrons rapidement vers vous pour vous confirmer la bonne prise en compte des éléments transmis."
          />
        ) : (
          <Form form={form} className="fr-col-12 fr-col-md-10 fr-col-lg-8 fr-col-xl-6">
            <form.AppField name="idReseau">
              {(field) => (
                <field.CustomField
                  Component={NetworkSearchInput}
                  label="Identifiant SNCU - nom du réseau"
                  selectedNetwork={selectedNetwork}
                  onNetworkSelect={onNetworkSelect}
                />
              )}
            </form.AppField>
            {selectedNetwork && (
              <Link href={`/reseaux/${selectedNetwork['Identifiant reseau']}`} target="_blank">
                Voir la fiche actuelle du réseau
              </Link>
            )}
            <form.AppField name="type">
              {(field) => (
                <field.RadioField
                  label=""
                  orientation="horizontal"
                  className="fr-mt-4w"
                  options={[
                    { label: 'Collectivité', nativeInputProps: { value: 'collectivite' } },
                    { label: 'Exploitant', nativeInputProps: { value: 'exploitant' } },
                  ]}
                />
              )}
            </form.AppField>
            <form.AppField name="nom">{(field) => <field.TextField label="Votre nom" />}</form.AppField>
            <form.AppField name="prenom">{(field) => <field.TextField label="Votre prénom" />}</form.AppField>
            <form.AppField name="structure">{(field) => <field.TextField label="Votre structure" />}</form.AppField>
            <form.AppField name="fonction">{(field) => <field.TextField label="Votre fonction" />}</form.AppField>
            <form.AppField name="email">{(field) => <field.EmailField label="Votre email" />}</form.AppField>

            <Text mt="4w" mb="2w" fontWeight="bold">
              Modifier des informations erronées ou incomplètes sur la fiche
            </Text>
            <form.AppField name="reseauClasse">
              {(field) => (
                <field.BooleanRadioField label="" orientation="horizontal" yesLabel="Réseau classé" noLabel="Réseau non classé" />
              )}
            </form.AppField>
            <form.AppField name="maitreOuvrage">{(field) => <field.TextField label="Maître d’ouvrage" />}</form.AppField>
            <form.AppField name="gestionnaire">{(field) => <field.TextField label="Gestionnaire" />}</form.AppField>
            <form.AppField name="siteInternet">
              {(field) => (
                <field.TextField
                  label="Site internet du réseau"
                  // type: 'url', uncomment when all data has been cleaned from airtable
                  nativeInputProps={{ placeholder: 'https://www.monreseau.fr' }}
                />
              )}
            </form.AppField>

            <Text mt="4w" mb="1w" fontWeight="bold">
              Renseigner des informations complémentaires à faire apparaître sur la fiche du réseau (
              {clientConfig.networkInfoFieldMaxCharacters} caractères maximum) (Optionnel)
            </Text>
            <form.AppField name="informationsComplementaires">
              {(field) => (
                <field.TextareaField
                  label=""
                  nativeTextAreaProps={{
                    maxLength: clientConfig.networkInfoFieldMaxCharacters,
                    placeholder:
                      'Projets de verdissement ou de développement du réseau, puissance minimale requise pour le raccordement, ou toute autre information utile (cible grand public et professionnels)',
                    rows: 5,
                  }}
                />
              )}
            </form.AppField>
            <Text mt="4w" mb="1w" fontWeight="bold">
              Télécharger des documents à mettre à disposition depuis la fiche du réseau (schéma directeur, ...) - 3 documents PDF maximum
              (&lt;5 Mo par fichier) (Optionnel)
            </Text>
            <form.AppField name="fichiers">
              {(field) => <field.UploadField label="" append removable multiple nativeInputProps={{ accept: 'application/pdf' }} />}
            </form.AppField>
            <Text mt="4w">Les informations transmises seront validées manuellement par France Chaleur Urbaine avant mise en ligne.</Text>

            <form.SubmitButton className="fr-mt-2w">Soumettre la demande de modification</form.SubmitButton>
          </Form>
        )}
      </Box>
    </SimplePage>
  );
}

export default ModifierReseauxPage;

/**
 * Helper used to create a File object (as used by the input[type=file] component)
 * to display already existing files as if they had been uploaded manually.
 */
async function createFileFromURL(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`invalid status: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const file = new File([new Blob([buffer])], filename, {
      type: res.headers.get('content-type') ?? '',
    });

    return file;
  } catch (err) {
    console.error('could not create file from url', err);
    return null;
  }
}
