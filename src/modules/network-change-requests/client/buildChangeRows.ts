import { getFileTypeGroup } from '@/modules/files/constants';

import {
  type NetworkChangeRequestGeometryRole,
  networkChangeRequestGeometryRoles,
  networkChangeRequestPayloadFieldLabels,
} from '../constants';
import { documentChangeKey, documentRemovalChangeKey } from '../document-change-keys';
import type { NetworkChangeRequestItem, ReviewContext } from './NetworkChangeRequestDetail';
import type { RequestChangeFile, RequestChangeRow } from './RequestChangesTable';

/** Download link and antivirus state of a file uploaded with the request. */
const uploadedFile = (file: NetworkChangeRequestItem['files'][number]) => ({
  fileId: file.id,
  filename: file.filename,
  href: `/api/files/${file.id}`,
  purged: file.purged_at !== null,
  scanStatus: file.scan_status,
  size: file.size,
});

/** A geo file of the request has no conversion result yet (the job runs in the background). */
export const isConversionPending = (request: NetworkChangeRequestItem) =>
  networkChangeRequestGeometryRoles.some(
    (role) =>
      request.files.some((file) => file.role === role && file.replaced_at === null && getFileTypeGroup(file.content_type) === 'geo') &&
      !request.geometries.some((geometry) => geometry.role === role)
  );

/** Rows of the changes table, per kind of request: proposed values against the current network when it is known. */
export function buildChangeRows(request: NetworkChangeRequestItem, network: ReviewContext['network']): RequestChangeRow[] {
  const payload = request.payload as Record<string, unknown>;
  const fieldRow = (key: string, current: unknown, locked?: boolean): RequestChangeRow[] =>
    key in payload && payload[key] !== undefined
      ? [{ current, key, label: networkChangeRequestPayloadFieldLabels[key] ?? key, locked, proposed: payload[key] }]
      : [];
  // the documents the page would list once applied: published ones (kept or proposed for removal), then the new files
  const removals = Array.isArray(payload.documentsToRemove) ? (payload.documentsToRemove as string[]) : [];
  const documentFiles: RequestChangeFile[] = [
    ...(network?.documents ?? []).map((document) => ({
      fileId: document.id,
      filename: document.filename,
      href: `/api/files/${document.id}`,
      key: documentRemovalChangeKey(document.id),
      size: document.size,
      status: removals.includes(document.id) ? ('removed' as const) : ('kept' as const),
    })),
    ...request.files
      .filter((file) => file.role === 'document')
      .map((file) => ({ ...uploadedFile(file), key: documentChangeKey(file.id), status: 'added' as const })),
  ];
  const documentsRow: RequestChangeRow[] = documentFiles.some((file) => file.status !== 'kept')
    ? [{ current: null, files: documentFiles, key: 'documents', label: 'Documents publiés', proposed: null }]
    : [];
  // a geometry row as soon as files were uploaded for the role: the files are listed with the state of their conversion
  const geometryRow = (role: NetworkChangeRequestGeometryRole, label: string, locked?: boolean): RequestChangeRow[] => {
    const files = request.files.filter((file) => file.role === role);
    if (files.length === 0) {
      return [];
    }
    const geometry = request.geometries.find((item) => item.role === role);
    const hasGeoFiles = files.some((file) => getFileTypeGroup(file.content_type) === 'geo');
    const proposed = geometry?.error
      ? `Conversion impossible : ${geometry.error}`
      : geometry
        ? 'Géométrie convertie (voir la carte)'
        : hasGeoFiles
          ? 'Conversion en cours'
          : 'PDF seul : à dessiner à la main sur la carte admin';
    return [
      {
        conversionFailed: !!geometry?.error,
        current: network && role === 'trace' ? (network.hasGeometry ? 'Tracé actuel (voir la carte)' : 'Aucun tracé') : null,
        files: files.map((file) => ({
          ...uploadedFile(file),
          key: `${role}:${file.id}`,
          status: file.replaced_at ? ('replaced' as const) : ('attached' as const),
        })),
        key: role,
        label,
        locked,
        proposed,
      },
    ];
  };
  switch (request.kind) {
    case 'fiche':
      return [...fieldRow('informationsComplementaires', network?.informationsComplementaires), ...documentsRow];
    case 'enquete':
      // decided field by field on the « Enquête FEDENE » page, never listed with the submitted requests
      return [];
    case 'trace_existant':
      return [
        // not attached: the trace creates the network, it cannot be excluded
        ...geometryRow('trace', 'Tracé', request.network_type === null),
        ...geometryRow('pdp', 'Périmètre de développement prioritaire'),
        ...fieldRow('gestionnaire', network?.gestionnaire),
        ...fieldRow('maitreOuvrage', network?.maitreOuvrage),
        ...(network?.type === 'reseau_de_froid' ? [] : fieldRow('ouvertAuxRaccordements', network?.ouvertAuxRaccordements)),
        ...(payload.reseauClasse === null ? [] : fieldRow('reseauClasse', network?.reseauClasse)),
      ];
    case 'trace_construction':
      return [
        ...geometryRow('trace', 'Tracé', true),
        ...geometryRow('pdp', 'Périmètre de développement prioritaire'),
        ...fieldRow('dateMiseEnServicePrevisionnelle', null),
        // attached to a heat network, the created extension inherits its gestionnaire and MO (see `inheritedConstructionFields`)
        ...(network ? [] : [...fieldRow('gestionnaire', null), ...fieldRow('maitreOuvrage', null)]),
        ...fieldRow('ouvertAuxRaccordements', null),
      ];
    case 'pdp':
      return geometryRow('pdp', 'Périmètre de développement prioritaire', true);
    case 'autre':
      return [];
  }
}
