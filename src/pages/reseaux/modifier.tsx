import NetworkSearchInput from '@components/Network/NetworkSearchInput';
import SimplePage from '@components/shared/page/SimplePage';
import Slice from '@components/Slice';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import LoadingButton from '@components/ui/LoadingButton';
import Text from '@components/ui/Text';
import {
  Alert,
  Button,
  Icon,
  Radio,
  RadioGroup,
  TextInput,
} from '@dataesr/react-dsfr';
import { ModificationReseau } from '@pages/api/modification-reseau';
import { NetworkSearchResult } from '@pages/api/networks/search';
import { postFetchJSON } from '@utils/network';
import { sleep } from '@utils/time';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { clientConfig } from 'src/client-config';

type FormState = Omit<ModificationReseau, 'fichiers'> & {
  fichiers: File[];
};

const initialFormState: FormState = {
  idReseau: '',
  type: undefined as any,

  nom: '',
  prenom: '',
  structure: '',
  fonction: '',
  email: '',

  reseauClasse: undefined as any,
  maitreOuvrage: '',
  gestionnaire: '',
  siteInternet: '',
  informationsComplementaires: '',
  fichiers: [],
};

type FichiersError =
  | 'file_size_exceeded'
  | 'files_count_exceeded'
  | 'invalid_file_type';

function ModifierReseauxPage() {
  const router = useRouter();
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const [formSent, setFormSent] = useState(false);
  const [apiError, setAPIError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] =
    useState<NetworkSearchResult | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const fichiersError = useMemo<FichiersError | null>(() => {
    return formState.fichiers.length > 3
      ? 'files_count_exceeded'
      : formState.fichiers.some((fichier) => fichier.size > 5 * 1024 * 1024)
      ? 'file_size_exceeded'
      : formState.fichiers.some((fichier) => fichier.type !== 'application/pdf')
      ? 'invalid_file_type'
      : null;
  }, [formState.fichiers]);

  async function setFormValue<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) {
    setFormState((formState) => ({
      ...formState,
      [key]: value,
    }));
  }

  // automatically fill the network when coming from another link
  useEffect(() => {
    const reseau = router.query.reseau;
    if (router.isReady && typeof reseau === 'string') {
      setFormValue('idReseau', reseau);
      (async () => {
        const [network] = await postFetchJSON<NetworkSearchResult[]>(
          '/api/networks/search',
          {
            search: reseau,
          }
        );
        if (network) {
          onNetworkSelect(network);
          // download existing files as if they were uploaded by the user
          if (network.fichiers instanceof Array) {
            const existingFiles = (
              await Promise.all(
                network.fichiers.map(
                  async (fichier) =>
                    await createFileFromURL(
                      `/api/networks/${network['Identifiant reseau']}/files/${fichier.id}`,
                      fichier.filename
                    )
                )
              )
            ).filter((v): v is File => v !== null);

            setFormValue('fichiers', existingFiles);
          }
        }
      })();
    }
  }, [router.isReady, router.query.reseau]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    for (const [key, value] of Object.entries(formState)) {
      if (value instanceof Array) {
        for (const part of Array.from(value)) {
          formData.append(key, part);
        }
      } else {
        formData.set(key, value as string);
      }
    }

    try {
      const res = await fetch('/api/modification-reseau', {
        method: 'POST',
        body: formData,
      });
      if (res.status !== 200) {
        throw new Error(`invalid status ${res.status}`);
      }
      setFormSent(true);
    } catch (err: any) {
      setAPIError(true);
    } finally {
      await sleep(300); // improve UX by not showing an instant loading
      setIsSubmitting(false);
    }
  }

  async function onNetworkSelect(network: NetworkSearchResult | null) {
    setSelectedNetwork(network);
    if (!network) {
      return;
    }

    setFormValue(
      'idReseau',
      `${network['Identifiant reseau']} - ${network.nom_reseau}`
    );
    setFormValue('reseauClasse', network['reseaux classes'] ?? false);
    setFormValue(
      'maitreOuvrage',
      [
        network.MO,
        stripBadAirtableValues(network.adresse_mo),
        stripBadAirtableValues(network.CP_MO),
        stripBadAirtableValues(network.ville_mo),
      ]
        .filter((v) => !!v)
        .join(' - ')
    );
    setFormValue(
      'gestionnaire',
      [
        network.Gestionnaire,
        network.adresse_gestionnaire,
        network.CP_gestionnaire,
        network.ville_gestionnaire,
      ]
        .filter((v) => !!v)
        .join(' - ')
    );
    setFormValue('siteInternet', network.website_gestionnaire ?? '');
    setFormValue(
      'informationsComplementaires',
      network.informationsComplementaires ?? ''
    );
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    setFormValue('fichiers', [...formState.fichiers, ...files]);
  }

  return (
    <SimplePage
      title="Modification de page réseau : France Chaleur Urbaine"
      currentPage="/outils/modifier-page-reseau"
    >
      <Slice padding={4}>
        <Heading size="h3">
          Complétez les informations qui apparaissent sur la fiche de votre
          réseau
        </Heading>
        <Text>
          Sur les fiches par réseau, dans un souci d'homogénéité, seules sont
          diffusées par France Chaleur Urbaine&nbsp;:
        </Text>
        <ul>
          <li>
            les données issues de la dernière enquête réalisée par la FEDENE
            Réseaux de chaleur & froid pour le compte du ministère de la
            transition énergétique&nbsp;;
          </li>
          <li>les données réglementaires de l'arrêté "DPE".</li>
        </ul>
        <Text mt="2w">
          Il vous est toutefois donné la possibilité de compléter ces éléments
          par toute information qui vous semblerait utile (verdissement ou
          développement en cours ou actés, capacité de raccordement du réseau,
          puissance minimale requise,...). Vos compléments apparaîtront sur la
          fiche dans un encadré intitulé "Informations complémentaires fournies
          par la collectivité ou l'exploitant du réseau".
        </Text>
        <Text mt="2w" mb="6w">
          Vous avez également la possibilité de télécharger jusqu'à 3 documents
          PDF que vous jugez utiles à porter à la connaissance des usagers de
          France chaleur Urbaine. Nous vous encourageons notamment à déposer le
          schéma directeur du réseau, qui nous est souvent demandé.
        </Text>

        {formSent ? (
          <Alert
            type="success"
            title="Merci pour votre contribution"
            description="Nous reviendrons rapidement vers vous pour vous confirmer la bonne prise en compte des éléments transmis."
          />
        ) : (
          <form
            onSubmit={submitForm}
            className="fr-col-12 fr-col-md-10 fr-col-lg-8 fr-col-xl-6"
          >
            <NetworkSearchInput
              label={
                <>
                  Identifiant SNCU - nom du réseau
                  <span className="error"> *</span>
                </>
              }
              value={formState.idReseau}
              onChange={(value) => {
                setFormValue('idReseau', value);
                setSelectedNetwork(null); // hide the link
              }}
              selectedNetwork={selectedNetwork}
              onNetworkSelect={onNetworkSelect}
            />
            {selectedNetwork && (
              <Link
                href={`/reseaux/${selectedNetwork['Identifiant reseau']}`}
                target="_blank"
              >
                Voir la fiche actuelle du réseau
              </Link>
            )}
            <RadioGroup
              required
              legend=""
              isInline
              className="fr-mt-4w"
              value={formState.type}
              onChange={(value) => setFormValue('type', value)}
            >
              <Radio label="Collectivité" value="collectivite" />
              <Radio label="Exploitant" value="exploitant" />
            </RadioGroup>
            <TextInput
              required
              label="Votre nom"
              value={formState.nom}
              onChange={(e) => setFormValue('nom', e.target.value)}
            />
            <TextInput
              required
              label="Votre prénom"
              value={formState.prenom}
              onChange={(e) => setFormValue('prenom', e.target.value)}
            />
            <TextInput
              required
              label="Votre structure"
              value={formState.structure}
              onChange={(e) => setFormValue('structure', e.target.value)}
            />
            <TextInput
              required
              label="Votre fonction"
              value={formState.fonction}
              onChange={(e) => setFormValue('fonction', e.target.value)}
            />
            <TextInput
              required
              type="email"
              label="Votre email"
              value={formState.email}
              onChange={(e) => setFormValue('email', e.target.value)}
            />

            <Text mt="4w" mb="2w" fontWeight="bold">
              Modifier des informations erronées ou incomplètes sur la fiche
            </Text>
            <RadioGroup
              required
              legend=""
              isInline
              value={
                formState.reseauClasse !== undefined
                  ? formState.reseauClasse
                    ? 'classe'
                    : 'nonClasse'
                  : undefined
              }
              onChange={(value) =>
                setFormValue('reseauClasse', value === 'classe')
              }
            >
              {/* hack: the lib dataesr can't control this radio input so we force a rerender with the keys */}
              <Radio
                label="Réseau classé"
                value="classe"
                key={`${formState.reseauClasse}-classe`}
              />
              <Radio
                label="Réseau non classé"
                value="nonClasse"
                key={`${formState.reseauClasse}-nonClasse`}
              />
            </RadioGroup>
            <TextInput
              required
              label="Maître d’ouvrage"
              value={formState.maitreOuvrage}
              onChange={(e) => setFormValue('maitreOuvrage', e.target.value)}
            />
            <TextInput
              required
              label="Gestionnaire"
              value={formState.gestionnaire}
              onChange={(e) => setFormValue('gestionnaire', e.target.value)}
            />
            <TextInput
              required
              type={'url' as any} // unsupported type by the dsfr lib
              label="Site internet du réseau"
              placeholder="https://www.monreseau.fr"
              value={formState.siteInternet}
              onChange={(e) => setFormValue('siteInternet', e.target.value)}
            />

            <Text mt="4w" mb="1w" fontWeight="bold">
              Renseigner des informations complémentaires à faire apparaître sur
              la fiche du réseau ({clientConfig.networkInfoFieldMaxCharacters}{' '}
              caractères maximum)
            </Text>
            <TextInput
              required
              textarea
              placeholder="Projets de verdissement ou de développement du réseau, puissance minimale requise pour le raccordement, ou toute autre information utile (cible grand public et professionnels)"
              value={formState.informationsComplementaires}
              onChange={(e) =>
                setFormValue('informationsComplementaires', e.target.value)
              }
              maxLength={clientConfig.networkInfoFieldMaxCharacters}
              rows={5}
              style={{ cursor: 'text' }} // defined to pointer by the dsfr lib
            />

            <Text mt="4w" mb="1w" fontWeight="bold">
              Télécharger des documents à mettre à disposition depuis la fiche
              du réseau (schéma directeur, ...) - 3 documents PDF maximum (&lt;5
              Mo par fichier)
            </Text>
            <input
              className="fr-hidden"
              ref={fileUploadInputRef}
              type="file"
              onChange={handleFileUpload}
              multiple
              accept="application/pdf"
              aria-hidden
            />
            <div className="fr-grid-row fr-grid-row--top">
              <Button
                onClick={() => fileUploadInputRef.current!.click()}
                secondary
              >
                Choisir un fichier
              </Button>
              <Box ml="2w">
                {formState.fichiers?.map((fichier, index) => (
                  <Text key={index} mr="1w">
                    - {fichier.name} - {Math.round(fichier.size / 1024)} ko{' '}
                    <Button
                      size="sm"
                      className="fr-btn--tertiary-no-outline"
                      title="Supprimer le fichier"
                      onClick={() => {
                        formState.fichiers.splice(index, 1);
                        setFormValue('fichiers', [...formState.fichiers]);
                      }}
                    >
                      <Icon
                        name="ri-delete-bin-2-line"
                        color="var(--text-default-error)"
                        size="lg"
                        iconPosition="center"
                      />
                    </Button>
                    {fichier.size > 5 * 1024 * 1024 && (
                      <Text as="div" color="error">
                        Ce fichier excède la taille maximale autorisée (5 Mo).
                      </Text>
                    )}
                    {fichier.type !== 'application/pdf' && (
                      <Text as="div" color="error">
                        Seuls les fichiers PDF sont autorisés.
                      </Text>
                    )}
                  </Text>
                ))}
              </Box>
            </div>
            {fichiersError === 'files_count_exceeded' && (
              <Text color="error" mt="1w">
                Vous ne pouvez déposer que 3 fichiers maximum.
              </Text>
            )}
            <Text mt="6w">
              Les informations transmises seront validées manuellement par
              France Chaleur Urbaine avant mise en ligne.
            </Text>

            <LoadingButton
              className="fr-mt-2w"
              submit
              isLoading={isSubmitting}
              disabled={fichiersError !== null}
            >
              Soumettre la demande de modification
            </LoadingButton>

            {apiError && (
              <Text color="error" mt="2w">
                Une erreur est survenue. Veuillez{' '}
                <a
                  href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  nous contacter
                </a>
                .
              </Text>
            )}
          </form>
        )}
      </Slice>
    </SimplePage>
  );
}

export default ModifierReseauxPage;

function stripBadAirtableValues(value: string): string {
  return value && value !== '0' && value != '00000' ? value : '';
}

/**
 * Helper used to create a File object (as used by the input[type=file] component)
 * to display already existing files as if they had been uploaded manually.
 */
async function createFileFromURL(
  url: string,
  filename: string
): Promise<File | null> {
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
