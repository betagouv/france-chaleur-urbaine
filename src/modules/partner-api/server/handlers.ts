import { z } from 'zod';

import { mergeLegacyValues } from '@/modules/demands/server/legacy-values';
import { createEvent } from '@/modules/events/server/service';
import { getDemandForAccessCheck } from '@/modules/permissions/server/demand-access';
import { buildDemandAccessFilter, isUserResponsibleForDemand } from '@/modules/permissions/server/service';
import type { NetworkType } from '@/modules/reseaux/constants';
import { kdb } from '@/server/db/kysely';

import { type DemandDTO, zListDemandsQuery, zPatchDemandInput } from '../schema';
import { buildOrgAccess, type PartnerApiHandler } from './authentication';
import { toDemandDTO } from './dto';

/** Demande + nom/identifiant SNCU du réseau affecté (jointures partagées par la liste, la lecture unitaire et l'API v1 ENGIE). */
export const baseDemandQuery = () =>
  kdb
    .selectFrom('demands')
    .leftJoin('reseaux_de_chaleur as rdc', (j) =>
      j.onRef('rdc.id_fcu', '=', 'demands.network_id').on('demands.network_type', '=', 'reseau_de_chaleur')
    )
    .leftJoin('zones_et_reseaux_en_construction as zrc', (j) =>
      j.onRef('zrc.id_fcu', '=', 'demands.network_id').on('demands.network_type', '=', 'reseau_en_construction')
    )
    .select([
      'demands.id',
      'demands.created_at',
      'demands.updated_at',
      'demands.network_id',
      'demands.network_type',
      'demands.comment_gestionnaire',
      'demands.legacy_values',
      'demands.commune_code',
      'demands.departement_code',
      'demands.region_code',
    ])
    .select((eb) => [
      eb.fn.coalesce('rdc.nom_reseau', 'zrc.nom_reseau').as('network_name'),
      eb.ref('rdc.Identifiant reseau').as('network_sncu_id'),
      eb.fn.coalesce('rdc.Gestionnaire', 'zrc.gestionnaire').as('network_gestionnaire'),
      eb.ref('rdc.MO').as('network_maitre_ouvrage'),
    ])
    .where('demands.deleted_at', 'is', null)
    .where('demands.network_id', 'is not', null)
    .where('demands.network_type', 'is not', null)
    .$narrowType<{ network_id: number; network_type: NetworkType }>();

/**
 * `GET /api/v2/demands` — toutes les demandes des réseaux de l'organisation, triées par `date_modification` croissant.
 * Synchro incrémentale via `updated_since` (borne inclusive).
 */
export const listDemands: PartnerApiHandler<DemandDTO[]> = async (req, _res, auth) => {
  const { updated_since } = zListDemandsQuery.parse(req.query);
  const { user, permissions } = buildOrgAccess(auth.organizationId);

  // buildDemandAccessFilter applique `validated = true` + le scope organisation (sous-requête sur organization_id).
  let query = buildDemandAccessFilter(user, permissions)(baseDemandQuery());

  if (updated_since) {
    query = query.where('demands.updated_at', '>=', updated_since);
  }

  const rows = await query.orderBy('demands.updated_at', 'asc').execute();
  const dtos = rows.map(toDemandDTO);

  // Audit : trace chaque récupération de demandes via l'API (author_id null, contexte organisation).
  await createEvent({
    context_id: auth.organizationId,
    context_type: 'organization',
    data: {
      count: dtos.length,
      credential_id: auth.credentialId,
      organization_id: auth.organizationId,
      organization_name: auth.organizationName,
      updated_since: updated_since ? updated_since.toISOString() : null,
      version: 'v2',
    },
    type: 'api_demands_listed',
  });

  return dtos;
};

/**
 * `PATCH /api/v2/demands/{id}` — met à jour `statut` et/ou `commentaire`. Seules ces deux valeurs sont modifiables.
 * Ne renvoie pas la demande (accusé de succès générique via `handleRouteErrors`).
 * Renvoie 404 (sans divulgation) si la demande n'existe pas ou n'appartient pas aux réseaux de l'organisation.
 */
export const patchDemand: PartnerApiHandler<void> = async (req, res, auth) => {
  const id = z.uuidv4().parse(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  const input = zPatchDemandInput.parse(req.body);

  const { user, permissions } = buildOrgAccess(auth.organizationId);
  const demand = await getDemandForAccessCheck(id);
  if (!demand || !isUserResponsibleForDemand(user, permissions, demand)) {
    res.status(404).json({ message: 'Demande introuvable' });
    return;
  }

  await kdb
    .updateTable('demands')
    .set({
      ...(input.commentaire !== undefined && { comment_gestionnaire: input.commentaire }),
      ...(input.statut !== undefined && { legacy_values: mergeLegacyValues({ Status: input.statut }) }),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .execute();

  // Audit : mise à jour via l'API (author_id null), distincte de `demand_updated` (modifs utilisateur via l'UI).
  await createEvent({
    context_id: id,
    context_type: 'demand',
    data: { credential_id: auth.credentialId, organization_id: auth.organizationId, organization_name: auth.organizationName, ...input },
    type: 'api_demand_updated',
  });
};
