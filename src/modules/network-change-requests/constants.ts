import { z } from 'zod';

import { clientConfig } from '@/client-config';
import { type FileTypeGroup, fileUploadLimits } from '@/modules/files/constants';
import { MAX_NETWORK_DOCUMENTS, networkEntityTypes } from '@/modules/reseaux/constants';

export const networkChangeRequestKinds = ['fiche', 'trace_existant', 'trace_construction', 'pdp', 'autre', 'enquete'] as const;
export type NetworkChangeRequestKind = (typeof networkChangeRequestKinds)[number];

export const networkChangeRequestKindLabels: Record<NetworkChangeRequestKind, string> = {
  autre: 'Autre demande',
  enquete: "Écart avec l'enquête FEDENE",
  fiche: 'Modification de la fiche du réseau',
  pdp: 'Ajout ou modification de périmètre de développement prioritaire',
  trace_construction: "Tracé d'un réseau en construction",
  trace_existant: "Tracé d'un réseau existant",
};

/** `form`: submitted by a person (emails sent); `import`: created by a data import (no submitter, no email). */
export const networkChangeRequestOrigins = ['form', 'import'] as const;
export type NetworkChangeRequestOrigin = (typeof networkChangeRequestOrigins)[number];

export const networkChangeRequestStatuses = ['pending', 'processed'] as const;
export type NetworkChangeRequestStatus = (typeof networkChangeRequestStatuses)[number];

export const networkChangeRequestStatusLabels: Record<NetworkChangeRequestStatus, string> = {
  pending: 'À traiter',
  processed: 'Traitée',
};

export const networkChangeRequestContactTypes = ['collectivite', 'exploitant', 'autre'] as const;
export type NetworkChangeRequestContactType = (typeof networkChangeRequestContactTypes)[number];

export const networkChangeRequestContactTypeLabels: Record<NetworkChangeRequestContactType, string> = {
  autre: 'Autre',
  collectivite: 'Collectivité',
  exploitant: 'Exploitant',
};

export const networkChangeRequestFileRoles = ['document', 'trace', 'pdp'] as const;
export type NetworkChangeRequestFileRole = (typeof networkChangeRequestFileRoles)[number];

/** Roles whose files are converted server-side into a geometry. */
export const networkChangeRequestGeometryRoles = ['trace', 'pdp'] as const satisfies readonly NetworkChangeRequestFileRole[];
export type NetworkChangeRequestGeometryRole = (typeof networkChangeRequestGeometryRoles)[number];

export const networkChangeRequestFileRoleLabels: Record<NetworkChangeRequestFileRole, string> = {
  document: 'Document',
  pdp: 'Périmètre de développement prioritaire',
  trace: 'Tracé',
};

/** Which files each kind of request may carry, with the accepted type groups (checked against the detected content type). */
export const networkChangeRequestFileRules: Record<
  NetworkChangeRequestKind,
  Partial<Record<NetworkChangeRequestFileRole, { groups: readonly FileTypeGroup[]; max: number; min: number }>>
> = {
  autre: {},
  enquete: {},
  fiche: { document: { groups: ['pdf'], max: MAX_NETWORK_DOCUMENTS, min: 0 } },
  pdp: { pdp: { groups: ['geo', 'pdf'], max: fileUploadLimits.maxFiles, min: 1 } },
  trace_construction: {
    pdp: { groups: ['geo', 'pdf'], max: fileUploadLimits.maxFiles, min: 0 },
    trace: { groups: ['geo', 'pdf'], max: fileUploadLimits.maxFiles, min: 1 },
  },
  trace_existant: {
    pdp: { groups: ['geo', 'pdf'], max: fileUploadLimits.maxFiles, min: 0 },
    trace: { groups: ['geo', 'pdf'], max: fileUploadLimits.maxFiles, min: 1 },
  },
};

/** Labels of the kind-specific fields, for the admin detail view. */
export const networkChangeRequestPayloadFieldLabels: Record<string, string> = {
  commentaire: 'Commentaire',
  dansCadreDemandeADEME: "Dans le cadre d'une demande de subvention ADEME",
  dateMiseEnServicePrevisionnelle: 'Mise en service prévisionnelle',
  edition: "Édition de l'enquête",
  emailReferentCommercial: 'Référent commercial',
  gestionnaire: 'Gestionnaire',
  informationsComplementaires: 'Informations complémentaires',
  localisation: 'Localisation',
  maitreOuvrage: "Maître d'ouvrage",
  nomReseau: 'Nom du réseau',
  ouvertAuxRaccordements: 'Ouvert aux raccordements',
  precisions: 'Précisions',
  puissanceTotalePrevisionnelleMW: 'Puissance totale prévisionnelle (MW)',
  reseauClasse: 'Réseau classé',
};

export const NETWORK_LABEL_MAX_LENGTH = 200;

const zRequiredString = z.string({ error: 'Ce champ est obligatoire' }).trim().min(1, 'Ce champ est obligatoire');
const zOptionalString = z.string().trim().optional();
const zWebsite = z
  .string()
  .trim()
  .transform((link) => (link === '' || link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`))
  .optional();

const zTracePayloadShape = {
  commentaire: zOptionalString,
  dansCadreDemandeADEME: z.boolean({ error: 'Ce choix est obligatoire' }),
  emailReferentCommercial: z.email("L'adresse email n'est pas valide").optional(),
  gestionnaire: zRequiredString,
  localisation: zOptionalString,
  maitreOuvrage: zRequiredString,
  ouvertAuxRaccordements: z.boolean({ error: 'Ce choix est obligatoire' }),
  reseauClasse: z.boolean().nullable().default(null),
};

const hasReferentCommercialWhenOpen = (payload: { ouvertAuxRaccordements: boolean; emailReferentCommercial?: string }) =>
  !payload.ouvertAuxRaccordements || !!payload.emailReferentCommercial;
const referentCommercialRefineParams = {
  error: 'Le référent commercial est obligatoire si le réseau est ouvert aux raccordements',
  path: ['emailReferentCommercial'],
};

/** Kind-specific fields of a request, stored as-is in `network_change_requests.payload`. */
export const networkChangeRequestPayloadSchemas = {
  autre: z.object({
    dansCadreDemandeADEME: z.boolean({ error: 'Ce choix est obligatoire' }),
    precisions: zRequiredString,
  }),
  // only the survey values that differ from the base are present
  enquete: z.object({
    edition: z.number().int(),
    gestionnaire: z.string().trim().min(1).optional(),
    maitreOuvrage: z.string().trim().min(1).optional(),
    nomReseau: z.string().trim().min(1).optional(),
  }),
  // the public form only collects complementary information: corrections of the survey fields go through the contact form
  fiche: z.object({
    /** ids of documents published on the network that the submitter asks to take down (replaced by the new ones, or obsolete) */
    documentsToRemove: z.array(z.uuid()).max(MAX_NETWORK_DOCUMENTS).optional(),
    informationsComplementaires: z.string().trim().max(clientConfig.networkInfoFieldMaxCharacters).optional(),
  }),
  pdp: z.object({
    dansCadreDemandeADEME: z.boolean({ error: 'Ce choix est obligatoire' }),
    localisation: zRequiredString,
  }),
  trace_construction: z
    .object({
      ...zTracePayloadShape,
      dateMiseEnServicePrevisionnelle: zRequiredString,
      puissanceTotalePrevisionnelleMW: z.number().positive('La puissance doit être supérieure à 0').optional(),
    })
    .refine(hasReferentCommercialWhenOpen, referentCommercialRefineParams),
  trace_existant: z.object(zTracePayloadShape).refine(hasReferentCommercialWhenOpen, referentCommercialRefineParams),
} satisfies Record<NetworkChangeRequestKind, z.ZodType>;

export type NetworkChangeRequestPayloads = {
  [Kind in NetworkChangeRequestKind]: z.infer<(typeof networkChangeRequestPayloadSchemas)[Kind]>;
};
export type NetworkChangeRequestPayload = NetworkChangeRequestPayloads[NetworkChangeRequestKind];

export const zNetworkChangeRequestContact = z
  .object({
    email: z.email("L'adresse email n'est pas valide"),
    firstName: zRequiredString,
    function: zOptionalString,
    lastName: zRequiredString,
    structure: zOptionalString,
    type: z.enum(networkChangeRequestContactTypes, { error: 'Ce choix est obligatoire' }),
    typeOther: zOptionalString,
  })
  .refine((contact) => contact.type !== 'autre' || !!contact.typeOther, { error: 'Ce champ est obligatoire', path: ['typeOther'] });
export type NetworkChangeRequestContact = z.infer<typeof zNetworkChangeRequestContact>;

const zCreateNetworkChangeRequestCommon = {
  contact: zNetworkChangeRequestContact,
  files: z
    .array(z.object({ id: z.uuid(), role: z.enum(networkChangeRequestFileRoles) }))
    .max(2 * fileUploadLimits.maxFiles)
    .default([]),
  /** Existing network targeted by the request, `null` when it is unknown or not yet in the base. */
  network: z.object({ id: z.number().int(), type: z.enum(networkEntityTypes) }).nullable(),
  /** Network as named by the submitter (search result label or free text). */
  networkLabel: z.string().trim().min(1, 'Ce champ est obligatoire').max(NETWORK_LABEL_MAX_LENGTH),
};

export const zCreateNetworkChangeRequestInput = z.discriminatedUnion('kind', [
  z.object({ ...zCreateNetworkChangeRequestCommon, kind: z.literal('fiche'), payload: networkChangeRequestPayloadSchemas.fiche }),
  z.object({
    ...zCreateNetworkChangeRequestCommon,
    kind: z.literal('trace_existant'),
    payload: networkChangeRequestPayloadSchemas.trace_existant,
  }),
  z.object({
    ...zCreateNetworkChangeRequestCommon,
    kind: z.literal('trace_construction'),
    payload: networkChangeRequestPayloadSchemas.trace_construction,
  }),
  z.object({ ...zCreateNetworkChangeRequestCommon, kind: z.literal('pdp'), payload: networkChangeRequestPayloadSchemas.pdp }),
  z.object({ ...zCreateNetworkChangeRequestCommon, kind: z.literal('autre'), payload: networkChangeRequestPayloadSchemas.autre }),
  // `enquete` requests are only created by the FEDENE import, never by a form
]);
export type CreateNetworkChangeRequestInput = z.infer<typeof zCreateNetworkChangeRequestInput>;

/** Keys an admin can include or exclude when processing: the payload fields, one key per document change, `trace` and `pdp`. */
export const zAcceptNetworkChangeRequestInput = z.object({
  id: z.uuid(),
  /** when set, only these keys are applied (the request is processed either way) */
  included: z.array(z.string().max(100)).max(50).optional(),
});
export type AcceptNetworkChangeRequestInput = z.infer<typeof zAcceptNetworkChangeRequestInput>;

/** Attaches a pending request to a network of the base (or detaches it), so it can be applied. */
export const zLinkNetworkChangeRequestInput = z.object({
  id: z.uuid(),
  network: z.object({ id: z.number().int(), type: z.enum(networkEntityTypes) }).nullable(),
});
export type LinkNetworkChangeRequestInput = z.infer<typeof zLinkNetworkChangeRequestInput>;

/** An admin replaces the uploaded files of a role (a PDF trace, an unreadable file) by a GeoJSON they converted themselves. */
export const zReplaceNetworkChangeRequestGeometryFileInput = z.object({
  fileId: z.uuid(),
  id: z.uuid(),
  role: z.enum(networkChangeRequestGeometryRoles),
});
export type ReplaceNetworkChangeRequestGeometryFileInput = z.infer<typeof zReplaceNetworkChangeRequestGeometryFileInput>;

/** Kinds whose acceptance publishes something the submitter is told about by email (fiche or map). */
export const notifiedNetworkChangeRequestKinds: NetworkChangeRequestKind[] = ['fiche', 'trace_existant', 'trace_construction', 'pdp'];
