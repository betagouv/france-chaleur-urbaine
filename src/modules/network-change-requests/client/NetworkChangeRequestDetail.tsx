import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import { useDialogState } from '@/hooks/useDialogState';
import { getFileTypeGroup, type UploadedFile } from '@/modules/files/constants';
import { notify, toastErrors } from '@/modules/notification';
import type { NetworkEntityType } from '@/modules/reseaux/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';
import { postFormDataFetchJSON } from '@/utils/network';

import {
  type NetworkChangeRequestGeometryRole,
  networkChangeRequestContactTypeLabels,
  networkChangeRequestPayloadFieldLabels,
  networkChangeRequestStatusLabels,
  notifiedNetworkChangeRequestKinds,
} from '../constants';
import { documentChangeKey } from '../document-change-keys';
import type { AcceptNetworkChangeRequestData } from './AcceptNetworkChangeRequestDialog';
import { buildChangeRows } from './buildChangeRows';
import { DetailRow, DetailSection } from './DetailLayout';
import LinkNetworkField from './LinkNetworkField';
import RenameFileDialog, { type RenameFileData } from './RenameFileDialog';
import RequestChangesTable, { changeKeys, formatValue, type RequestChangeFile } from './RequestChangesTable';
import RequestGeometryMap from './RequestGeometryMap';

export type NetworkChangeRequestItem = RouterOutput['networkChangeRequests']['admin']['list'][number];
export type ReviewContext = RouterOutput['networkChangeRequests']['admin']['getReviewContext'];

type NetworkChangeRequestDetailProps = {
  onAccept: (data: AcceptNetworkChangeRequestData) => void;
  request: NetworkChangeRequestItem;
};

const networkTypeLabels: Record<NetworkEntityType, string> = {
  perimetre_de_developpement_prioritaire: 'PDP',
  reseau_de_chaleur: 'Réseau de chaleur',
  reseau_de_froid: 'Réseau de froid',
  reseau_en_construction: 'Réseau en construction',
};

const adminTabByType: Record<NetworkEntityType, string> = {
  perimetre_de_developpement_prioritaire: 'perimetres-de-developpement-prioritaire',
  reseau_de_chaleur: 'reseaux-de-chaleur',
  reseau_de_froid: 'reseaux-de-froid',
  reseau_en_construction: 'reseaux-en-construction',
};

// payload fields shown for information only: they are never written on the network
const informationOnlyFields = [
  'commentaire',
  'dansCadreDemandeADEME',
  'edition',
  'emailReferentCommercial',
  'localisation',
  'precisions',
  'puissanceTotalePrevisionnelleMW',
];

/**
 * Detail of a network change request: target network, proposed changes compared to the current page (each one can be
 * included or excluded), before / after map for traces and perimeters, files and the single decision button.
 * Keyed by request id by its parent: the state starts fresh for each request.
 */
function NetworkChangeRequestDetail({ onAccept, request }: NetworkChangeRequestDetailProps) {
  const { data: reviewContext } = trpc.networkChangeRequests.admin.getReviewContext.useQuery({ id: request.id });
  const currentNetwork = reviewContext?.network ?? null;
  const isLinked = request.network_type !== null && request.network_id !== null;
  const rows = buildChangeRows(request, currentNetwork);
  const changedKeys = rows.flatMap(changeKeys);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  // the changes are known once the review context (current network) is loaded: start with every change included, once;
  // later refetches of the context keep the admin's choices
  useEffect(() => {
    if (reviewContext && !initialized) {
      setIncluded(new Set(changedKeys));
      setInitialized(true);
    }
  }, [reviewContext, initialized, changedKeys]);

  const geometryRole: NetworkChangeRequestGeometryRole | null =
    request.kind === 'pdp' ? 'pdp' : request.kind === 'trace_existant' || request.kind === 'trace_construction' ? 'trace' : null;
  const geometryReady = (role: NetworkChangeRequestGeometryRole) =>
    request.geometries.some((geometry) => geometry.role === role && geometry.error === null);
  // PDF-only traces and perimeters are never converted: the admin draws them by hand, the acceptance just closes the request
  const hasGeoFiles = (role: NetworkChangeRequestGeometryRole) =>
    request.files.some((file) => file.role === role && getFileTypeGroup(file.content_type) === 'geo');
  // conversion not done (running, or failed until the file is replaced)
  const geometryPending = (role: NetworkChangeRequestGeometryRole) => hasGeoFiles(role) && !geometryReady(role);
  // a construction network or a perimeter drawn by hand: the request is closed without creating nor publishing anything
  const pdfOnly = (request.kind === 'trace_construction' || request.kind === 'pdp') && !hasGeoFiles(geometryRole as 'trace' | 'pdp');
  const needsDocumentedNetwork = request.kind === 'fiche' || request.kind === 'trace_existant' || request.kind === 'enquete';
  const isDocumentedLink = request.network_type === 'reseau_de_chaleur' || request.network_type === 'reseau_de_froid';
  const documentsPending = request.files.some(
    (file) => file.role === 'document' && file.scan_status === 'pending' && included.has(documentChangeKey(file.id))
  );
  const canAccept =
    initialized &&
    (!needsDocumentedNetwork || isDocumentedLink) &&
    (geometryRole === null || !geometryPending(geometryRole)) &&
    !(included.has('pdp') && geometryPending('pdp')) &&
    !documentsPending;
  // one button whose label says what the decision does: the bizdev sees every entity touched before clicking
  const actionLabel =
    included.size === 0 || request.kind === 'autre' || pdfOnly
      ? 'Clore la demande'
      : request.kind === 'trace_construction'
        ? [
            request.network_type === 'reseau_en_construction'
              ? 'Mettre à jour le réseau en construction'
              : 'Créer le réseau en construction',
            ...(included.has('pdp') ? ['créer son périmètre de développement prioritaire'] : []),
          ].join(' et ')
        : request.kind === 'pdp'
          ? 'Créer le périmètre de développement prioritaire'
          : request.kind === 'trace_existant'
            ? [...included].some((key) => key !== 'pdp')
              ? `Mettre à jour le réseau${included.has('pdp') ? ' et créer le périmètre de développement prioritaire' : ''}`
              : 'Créer le périmètre de développement prioritaire'
            : 'Mettre à jour la fiche';
  const notifiedEmail =
    included.size > 0 &&
    !pdfOnly &&
    request.origin === 'form' &&
    request.contact_email &&
    notifiedNetworkChangeRequestKinds.includes(request.kind)
      ? request.contact_email
      : null;
  // preview of the publication email, with the text of this kind of request
  const emailPreviewUrl = `/admin/emails?type=reseaux.demandeur.demande-acceptee&scenario=${request.kind === 'fiche' ? 'fiche' : 'defaut'}`;

  const utils = trpc.useUtils();
  const renameFile = trpc.networkChangeRequests.admin.renameFile.useMutation();
  const replaceGeometryFile = trpc.networkChangeRequests.admin.replaceGeometryFile.useMutation();
  const retryGeometryConversion = trpc.networkChangeRequests.admin.retryGeometryConversion.useMutation();
  const retryConversion = toastErrors(async () => {
    await retryGeometryConversion.mutateAsync({ id: request.id });
    await utils.networkChangeRequests.admin.list.invalidate();
    notify('success', 'Conversion relancée, le résultat apparaît dans quelques instants');
  });
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingRole, setReplacingRole] = useState<'trace' | 'pdp' | null>(null);
  const startReplacement = (role: 'trace' | 'pdp') => {
    setReplacingRole(role);
    replaceInputRef.current?.click();
  };
  const handleReplacement = toastErrors(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !replacingRole) {
      return;
    }
    try {
      const uploaded = await postFormDataFetchJSON<{ files: UploadedFile[] }>('/api/files/upload', { files: [file] });
      await replaceGeometryFile.mutateAsync({ fileId: uploaded.files[0].id, id: request.id, role: replacingRole });
      await Promise.all([
        utils.networkChangeRequests.admin.list.invalidate(),
        utils.networkChangeRequests.admin.getRequestGeometry.invalidate({ id: request.id, role: replacingRole }),
      ]);
      notify('success', 'Fichier remplacé, géométrie lue depuis le GeoJSON');
    } finally {
      // the same file can be picked again after an error
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  });
  const renameDialog = useDialogState<RenameFileData>();
  const openRename = (file: RequestChangeFile) =>
    renameDialog.open({
      filename: file.filename,
      onRename: async (filename) => {
        await renameFile.mutateAsync({ fileId: file.fileId, filename, id: request.id });
        await utils.networkChangeRequests.admin.list.invalidate();
      },
    });
  const linkField =
    request.status === 'pending' && request.kind !== 'autre' ? (
      <LinkNetworkField
        requestId={request.id}
        hasNetwork={isLinked}
        networkTypes={needsDocumentedNetwork ? ['reseau_de_chaleur'] : undefined}
      />
    ) : null;
  const payload = request.payload as Record<string, unknown>;
  // a construction request attached to a heat network creates an extension, whose gestionnaire and MO are copied from it
  const inheritedConstructionFields = request.kind === 'trace_construction' && isDocumentedLink ? ['gestionnaire', 'maitreOuvrage'] : [];
  const informationFields = Object.entries(payload).filter(
    ([key]) => informationOnlyFields.includes(key) || inheritedConstructionFields.includes(key)
  );
  const referent = reviewContext?.referentCommercial ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>Déposée le {dayjs(request.created_at).format('DD/MM/YYYY à HH:mm')}</span>
        <Badge as="span" small noIcon severity={request.status === 'pending' ? 'new' : 'success'}>
          {networkChangeRequestStatusLabels[request.status]}
        </Badge>
      </div>

      <DetailSection title="Réseau concerné">
        {currentNetwork ? (
          <DetailRow
            label="Réseau"
            value={
              <div>
                <strong>{currentNetwork.nom_reseau ?? 'Sans nom'}</strong> · SNCU {currentNetwork.identifiant_reseau ?? 'inconnu'} · id FCU{' '}
                {currentNetwork.id_fcu}
                {currentNetwork.identifiant_reseau && (
                  <>
                    {' '}
                    ·{' '}
                    <Link href={`/reseaux/${currentNetwork.identifiant_reseau}`} isExternal>
                      fiche
                    </Link>
                  </>
                )}{' '}
                ·{' '}
                <Link href={`/admin/reseaux?reseauxTab=${adminTabByType[currentNetwork.type]}`} isExternal>
                  admin
                </Link>
                {linkField}
              </div>
            }
          />
        ) : isLinked && request.network_type ? (
          <DetailRow
            label="Réseau"
            value={
              <div>
                {networkTypeLabels[request.network_type]} n° {request.network_id} ·{' '}
                <Link href={`/admin/reseaux?reseauxTab=${adminTabByType[request.network_type]}`} isExternal>
                  admin
                </Link>
                {linkField}
              </div>
            }
          />
        ) : (
          <>
            <DetailRow
              label={request.kind === 'pdp' ? 'Localisation indiquée par le déposant' : 'Réseau indiqué par le déposant'}
              value={request.network_label}
            />
            {linkField}
          </>
        )}
      </DetailSection>

      <DetailSection title={request.origin === 'import' ? 'Origine' : 'Contact'}>
        {request.origin === 'import' ? (
          <DetailRow label="Créée par" value={request.contact_type_other ?? 'Import de données'} />
        ) : (
          <>
            <DetailRow label="Nom" value={`${request.contact_first_name ?? ''} ${request.contact_last_name ?? ''}`.trim()} />
            <DetailRow
              label="Email"
              value={request.contact_email && <a href={`mailto:${request.contact_email}`}>{request.contact_email}</a>}
            />
            <DetailRow
              label="Type"
              value={
                request.contact_type === 'autre' && request.contact_type_other
                  ? request.contact_type_other
                  : networkChangeRequestContactTypeLabels[request.contact_type]
              }
            />
            <DetailRow label="Structure" value={request.contact_structure} />
            <DetailRow label="Fonction" value={request.contact_function} />
          </>
        )}
      </DetailSection>

      {rows.length > 0 && (
        <section>
          <Heading as="h3" size="h6" className="mb-2">
            Changements proposés
          </Heading>
          {request.status === 'pending' ? (
            <>
              <p className="mb-2 text-sm text-gray-600">
                Décochez les changements à ne pas appliquer. Les lignes grisées sont identiques à la fiche actuelle.
              </p>
              <RequestChangesTable
                rows={rows}
                included={included}
                onIncludedChange={setIncluded}
                onRenameFile={openRename}
                onReplaceGeometry={geometryRole ? startReplacement : undefined}
                onRetryConversion={geometryRole ? retryConversion : undefined}
              />
              <input
                ref={replaceInputRef}
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                className="hidden"
                onChange={(event) => void handleReplacement(event.target.files)}
              />
            </>
          ) : (
            <RequestChangesTable rows={rows} />
          )}
        </section>
      )}

      {informationFields.length > 0 && (
        <DetailSection title="Informations transmises (non reportées sur la fiche)">
          {informationFields.map(([key, value]) => (
            <DetailRow
              key={key}
              label={networkChangeRequestPayloadFieldLabels[key] ?? key}
              value={
                inheritedConstructionFields.includes(key) ? (
                  <span>
                    {formatValue(value)}{' '}
                    <span className="text-gray-600">(non repris : une extension reprend la valeur du réseau de chaleur étendu)</span>
                  </span>
                ) : (
                  formatValue(value)
                )
              }
            />
          ))}
          {referent && (
            <DetailRow
              label="Compte FCU du référent commercial"
              value={
                referent.account ? (
                  <span>
                    Compte existant ({referent.account.role}
                    {referent.account.active ? '' : ', désactivé'}),{' '}
                    {referent.account.hasNetworkPermission ? 'avec les droits sur ce réseau' : 'sans droit sur ce réseau'} ·{' '}
                    <Link href={`/admin/users?users_search=${encodeURIComponent(referent.email)}`} isExternal>
                      voir
                    </Link>
                  </span>
                ) : (
                  'Aucun compte avec cette adresse'
                )
              }
            />
          )}
        </DetailSection>
      )}

      {geometryRole && geometryReady(geometryRole) && (
        <section>
          <Heading as="h3" size="h6" className="mb-2">
            Avant / après sur la carte
          </Heading>
          <RequestGeometryMap requestId={request.id} geometryRole={geometryRole} />
          {request.kind !== 'pdp' && geometryReady('pdp') && (
            <>
              <p className="mt-4 mb-2 text-sm font-medium">Périmètre de développement prioritaire joint</p>
              <RequestGeometryMap requestId={request.id} geometryRole="pdp" />
            </>
          )}
        </section>
      )}
      {request.status === 'pending' ? (
        <div className="flex flex-col gap-2">
          {needsDocumentedNetwork && !isDocumentedLink && (
            <p className="mb-0 text-sm text-gray-600">Rattachez la demande à un réseau de chaleur de la base pour pouvoir l'appliquer.</p>
          )}
          {((geometryRole && geometryPending(geometryRole)) || (included.has('pdp') && geometryPending('pdp'))) && (
            <p className="mb-0 text-sm text-gray-600">
              Les fichiers géographiques ne sont pas encore convertis (conversion en cours, ou à relancer / fichier à remplacer) : le
              traitement sera possible ensuite.
            </p>
          )}
          {documentsPending && (
            <p className="mb-0 text-sm text-gray-600">
              Un document est encore en cours d'analyse antivirus : le traitement sera possible ensuite.
            </p>
          )}
          {geometryRole && !hasGeoFiles(geometryRole) && (
            <p className="mb-0 text-sm text-gray-600">
              Fichiers PDF uniquement : rien ne sera créé automatiquement, la géométrie est à dessiner sur la carte de Gestion des réseaux à
              partir du document.
            </p>
          )}
          <div className="flex flex-col gap-1">
            <div>
              <Button
                iconId="fr-icon-check-line"
                disabled={!canAccept}
                onClick={() =>
                  onAccept({
                    actionLabel,
                    emailPreviewUrl,
                    id: request.id,
                    included: [...included],
                    networkLabel: request.network_label,
                    notifiedEmail,
                  })
                }
              >
                {actionLabel}
                {changedKeys.length > 0 ? ` (${included.size}/${changedKeys.length})` : ''}
              </Button>
            </div>
            <span className="text-xs italic text-gray-600 mt-1">
              {notifiedEmail ? (
                <>
                  Le déposant sera notifié automatiquement de la mise en ligne (
                  <Link href={emailPreviewUrl} isExternal>
                    voir l'email
                  </Link>
                  ).
                </>
              ) : (
                'Aucun email ne sera envoyé au déposant.'
              )}
            </span>
          </div>
          <RenameFileDialog control={renameDialog} />
        </div>
      ) : (
        <DetailSection title="Traitement">
          <DetailRow label="Le" value={request.processed_at ? dayjs(request.processed_at).format('DD/MM/YYYY à HH:mm') : null} />
          <DetailRow label="Par" value={request.processed_by_email} />
          {request.contact_email && (
            <DetailRow
              label="Email au déposant"
              value={request.notified ? 'Mise en ligne notifiée' : 'Aucun : demande close sans rien publier, ou type sans mise en ligne'}
            />
          )}
        </DetailSection>
      )}
    </div>
  );
}

export default NetworkChangeRequestDetail;
