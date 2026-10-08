import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { useStore } from '@tanstack/react-form';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { clientConfig } from '@/client-config';
import NetworkSearchInput from '@/components/Network/NetworkSearchInput';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import type { UploadedFile } from '@/modules/files/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import { MAX_NETWORK_DOCUMENTS, networkTableForId } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';
import type { NetworkSearchResult } from '@/pages/api/networks/search';
import cx from '@/utils/cx';
import { postFetchJSON, postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';

const maxFileSize = 5 * 1024 * 1024;
const maxDocuments = MAX_NETWORK_DOCUMENTS;

const zModificationReseauForm = z
  .object({
    /** ids of the published documents to take down from the page */
    documentsToRemove: z.array(z.string()),
    email: z.email("L'adresse email n'est pas valide"),
    fichiers: z
      .array(z.instanceof(File))
      .max(maxDocuments, `Vous ne pouvez déposer que ${maxDocuments} fichiers maximum.`)
      .refine((files) => files.every((file) => file.type === 'application/pdf'), { error: 'Seuls les fichiers PDF sont autorisés.' })
      .refine((files) => files.every((file) => file.size <= maxFileSize), {
        error: 'Chaque fichier doit être inférieur à la taille maximale autorisée (5 Mo).',
      })
      .optional(),
    fonction: z.string().min(1, 'Ce champ est obligatoire'),
    idReseau: z.string().min(1, 'Ce champ est obligatoire'),
    informationsComplementaires: z.string().max(clientConfig.networkInfoFieldMaxCharacters).optional(),
    nom: z.string().min(1, 'Ce champ est obligatoire'),
    prenom: z.string().min(1, 'Ce champ est obligatoire'),
    /** documents already published on the selected network: the new files only fill the remaining slots */
    publishedDocumentsCount: z.number().int().min(0),
    structure: z.string().min(1, 'Ce champ est obligatoire'),
    type: z.enum(['collectivite', 'exploitant'], { error: 'Ce choix est obligatoire' }),
  })
  .refine((values) => (values.fichiers?.length ?? 0) <= maxDocuments - (values.publishedDocumentsCount - values.documentsToRemove.length), {
    error: `La fiche ne peut pas avoir plus de ${maxDocuments} documents : retirez-en ou déposez-en moins.`,
    path: ['fichiers'],
    when: () => true,
  });

type ModificationReseauFormValues = z.input<typeof zModificationReseauForm>;

const defaultValues: ModificationReseauFormValues = {
  documentsToRemove: [],
  email: '',
  fichiers: [],
  fonction: '',
  idReseau: '',
  informationsComplementaires: '',
  nom: '',
  prenom: '',
  publishedDocumentsCount: 0,
  structure: '',
  // required choice without a preselected option (see the module AGENTS.md pattern)
  type: undefined as unknown as 'collectivite' | 'exploitant',
};

/**
 * Public form: a collectivité or an exploitant proposes changes to the public page of a heat or cold network.
 * The proposal is stored as a change request (kind « fiche ») reviewed by the FCU team; PDF documents are uploaded first.
 */
function ModifierReseauxPage() {
  const router = useRouter();
  const [formSent, setFormSent] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkSearchResult | null>(null);
  const createRequest = trpc.networkChangeRequests.create.useMutation();

  const form = useAppForm({
    ...schemaValidation(zModificationReseauForm),
    defaultValues,
    onSubmit: toastErrors(
      async ({ value }) => {
        const networkTable = selectedNetwork?.['Identifiant reseau'] ? networkTableForId(selectedNetwork['Identifiant reseau']) : null;
        const uploaded =
          value.fichiers && value.fichiers.length > 0
            ? await postFormDataFetchJSON<{ files: UploadedFile[] }>('/api/files/upload', { files: value.fichiers })
            : { files: [] };
        await createRequest.mutateAsync({
          contact: {
            email: value.email,
            firstName: value.prenom,
            function: value.fonction,
            lastName: value.nom,
            structure: value.structure,
            type: value.type,
          },
          files: uploaded.files.map((file) => ({ id: file.id, role: 'document' as const })),
          kind: 'fiche',
          network:
            selectedNetwork && networkTable
              ? {
                  id: Number(selectedNetwork.id_fcu),
                  type: networkTable === 'reseaux_de_chaleur' ? 'reseau_de_chaleur' : 'reseau_de_froid',
                }
              : null,
          networkLabel: value.idReseau,
          payload: {
            documentsToRemove: value.documentsToRemove.length > 0 ? value.documentsToRemove : undefined,
            // an empty text is not a proposal to erase the current one
            informationsComplementaires: value.informationsComplementaires || undefined,
          },
        });
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
    form.setFieldValue('informationsComplementaires', network.informationsComplementaires ?? '', { dontUpdateMeta: true });
    form.setFieldValue('documentsToRemove', [], { dontUpdateMeta: true });
    form.setFieldValue('publishedDocumentsCount', network.documents.length, { dontUpdateMeta: true });
  };

  const documentsToRemove = useStore(form.store, (state) => state.values.documentsToRemove);
  const keptDocumentsCount = selectedNetwork ? selectedNetwork.documents.length - documentsToRemove.length : 0;
  const remainingDocumentSlots = Math.max(0, maxDocuments - keptDocumentsCount);

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
      if (network) {
        onNetworkSelect(network);
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
            transition énergétique, complétées par France Chaleur Urbaine&nbsp;;
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
          Vous avez également la possibilité de télécharger jusqu'à {maxDocuments} documents PDF que vous jugez utiles à porter à la
          connaissance des usagers de France chaleur Urbaine. Nous vous encourageons notamment à déposer le schéma directeur du réseau, qui
          nous est souvent demandé. Les documents déjà publiés sont listés une fois le réseau choisi : vous pouvez les consulter, et
          demander le retrait de ceux qui ne sont plus à jour.
        </Text>

        {formSent ? (
          <Alert
            severity="success"
            title="Merci pour votre contribution"
            description="Un accusé de réception vous a été envoyé par email. Nous reviendrons rapidement vers vous pour vous confirmer la bonne prise en compte des éléments transmis."
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
              <Link href={`/reseaux/${selectedNetwork['Identifiant reseau']}`} isExternal>
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
              <Link href="/contact">Modifier des informations erronées ou incomplètes sur la fiche</Link>
            </Text>

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
              Documents mis à disposition depuis la fiche du réseau (schéma directeur, ...) - {maxDocuments} documents PDF maximum (&lt;5 Mo
              par fichier) (Optionnel)
            </Text>
            {selectedNetwork && selectedNetwork.documents.length > 0 && (
              <form.AppField name="documentsToRemove">
                {(field) => (
                  <div className="mb-2w">
                    Document(s) déjà publié(s) :{' '}
                    {selectedNetwork.documents.map((document) => {
                      const removed = field.state.value.includes(document.id);
                      return (
                        <div key={document.id} className="flex items-center gap-2">
                          <span className={cx(removed && 'line-through text-gray-500')}>
                            -{' '}
                            <a
                              href={`/api/networks/${selectedNetwork['Identifiant reseau']}/files/${document.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {document.filename}
                            </a>{' '}
                            <span className="text-gray-600">({formatFileSize(document.size)})</span>
                          </span>
                          {removed ? (
                            <Button
                              size="small"
                              className="fr-btn--tertiary-no-outline"
                              onClick={() => field.handleChange(field.state.value.filter((fileId) => fileId !== document.id))}
                            >
                              Annuler le retrait
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              className="fr-btn--tertiary-no-outline"
                              title="Retirer ce document de la fiche"
                              onClick={() => field.handleChange([...field.state.value, document.id])}
                            >
                              <Icon name="ri-delete-bin-2-line" color="var(--text-default-error)" size="lg" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </form.AppField>
            )}
            {selectedNetwork && remainingDocumentSlots < maxDocuments && (
              <Text size="sm" className="fr-hint-text" mb="1w">
                {remainingDocumentSlots} emplacement(s) restant(s) sur la fiche
              </Text>
            )}
            <form.AppField name="fichiers">
              {(field) => <field.UploadField label="" append removable multiple nativeInputProps={{ accept: 'application/pdf' }} />}
            </form.AppField>
            <Text mt="4w">Les informations transmises seront validées manuellement par France Chaleur Urbaine avant mise en ligne.</Text>

            <form.SubmitButton className="fr-mt-2w">Envoyer les informations complémentaires</form.SubmitButton>
          </Form>
        )}
      </Box>
    </SimplePage>
  );
}

export default ModifierReseauxPage;
