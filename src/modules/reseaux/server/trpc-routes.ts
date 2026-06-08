import { z } from 'zod';

import { createUserEvent } from '@/modules/events/server/service';
import { getUsersWithNetworkPermission, removeNetworkPermissionFromAllUsers } from '@/modules/permissions/server/service';
import {
  type DeleteNetworkInput,
  type NetworkType,
  networkEntityToTable,
  networkEntityTypes,
  reminderTypes,
  tableToNetworkEntity,
  zApplyGeometriesUpdatesInput,
  zCreateNetworkInput,
  zDeleteGeomUpdateInput,
  zDeleteNetworkInput,
  zDownloadNetworkGeometryInput,
  zGetNetworkEligibilityStatusInput,
  zUpdateGeomUpdateInput,
  zUpdatePerimetreDeDeveloppementPrioritaireInput,
  zUpdateReseauEnConstructionInput,
  zUpdateReseauInput,
} from '@/modules/reseaux/constants';
import { adminRoute, demandAccessRoute, route, router } from '@/modules/trpc/server';
import { kdb, sql } from '@/server/db/kysely';
import { getCityEligilityStatus, getEligilityStatus, getNetworkEligilityStatus } from '@/server/services/addresseInformation';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

type Interval = [number, number];

export type ReseauxDeChaleurLimits = {
  tauxENRR: Interval;
  emissionsCO2: Interval;
  contenuCO2: Interval;
  prixMoyen: Interval;
  livraisonsAnnuelles: Interval;
  anneeConstruction: Interval;
};

import { createNetworkReminder, deleteNetworkReminder, updateNetworkNotes, updateNetworkReminder } from './reminders';
import * as reseauxService from './service';

/**
 * Returns the permission type matching a network table, or null when the network
 * cannot be a permission resource (cold networks and PDPs have no linked permissions).
 */
const networkPermissionType = (table: DeleteNetworkInput['type']): NetworkType | null => {
  const entity = tableToNetworkEntity[table];
  return entity === 'reseau_de_chaleur' || entity === 'reseau_en_construction' ? entity : null;
};

const reseauDeChaleurRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxDeChaleur();
  }),
  updateTags: adminRoute.input(zUpdateReseauInput).mutation(async ({ input }) => {
    return await reseauxService.updateTags(input.id, input.tags);
  }),
});

const reseauEnConstructionRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxEnConstruction();
  }),
  updateTags: adminRoute.input(zUpdateReseauEnConstructionInput).mutation(async ({ input }) => {
    return await reseauxService.updateReseauEnConstruction(input.id, input.tags);
  }),
});

const reseauDeFroidRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listReseauxDeFroid();
  }),
});

const perimetreDeDeveloppementPrioritaireRouter = router({
  list: adminRoute.query(async () => {
    return await reseauxService.listPerimetresDeDeveloppementPrioritaire();
  }),
  update: adminRoute.input(zUpdatePerimetreDeDeveloppementPrioritaireInput).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await reseauxService.updatePerimetreDeDeveloppementPrioritaire(id, data);
    await createUserEvent({
      author_id: ctx.user.id,
      context_id: String(id),
      context_type: 'perimetre_de_developpement_prioritaire',
      data,
      type: 'pdp_updated',
    });
  }),
});

const networkRemindersRouter = router({
  create: adminRoute
    .input(
      z.object({
        createdAt: z.string().optional(),
        networkId: z.number(),
        networkType: z.enum(networkEntityTypes),
        note: z.string().nullable().optional(),
        type: z.enum(reminderTypes),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createNetworkReminder({
        author_id: ctx.user.id,
        created_at: input.createdAt ? new Date(input.createdAt) : undefined,
        network_id: input.networkId,
        network_type: input.networkType,
        note: input.note ?? null,
        type: input.type,
      });
    }),
  delete: adminRoute.input(z.object({ id: z.string().uuid() })).mutation(async ({ input, ctx }) => {
    await deleteNetworkReminder(input.id, ctx.user.id);
  }),
  update: adminRoute
    .input(
      z.object({
        createdAt: z.string().optional(),
        id: z.string().uuid(),
        note: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const changes: { note?: string | null; created_at?: Date } = {};
      if ('note' in input) changes.note = input.note ?? null;
      if (input.createdAt) changes.created_at = new Date(input.createdAt);
      await updateNetworkReminder(input.id, changes, ctx.user.id);
    }),
  updateNotes: adminRoute
    .input(
      z.object({
        networkId: z.number(),
        networkType: z.enum(networkEntityTypes),
        notes: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reseau = await reseauxService.getNetworkLabel(input.networkId, networkEntityToTable[input.networkType]);
      await updateNetworkNotes(input.networkId, input.networkType, input.notes);
      await createUserEvent({
        author_id: ctx.user.id,
        context_id: String(input.networkId),
        context_type: input.networkType,
        data: {
          communes_count: reseau.communes_count,
          first_commune: reseau.first_commune,
          identifiant_reseau: reseau.identifiant_reseau,
          network_id: input.networkId,
          network_type: input.networkType,
          nom_reseau: reseau.nom_reseau,
          notes: input.notes,
        },
        type: 'network_notes_updated',
      });
    }),
});

export const reseauxRouter = router({
  applyGeometriesUpdates: adminRoute
    .input(zApplyGeometriesUpdatesInput)
    .mutation(async ({ input, ctx }) => await reseauxService.applyGeometriesUpdates(input, ctx)),
  cityNetwork: route.input(z.object({ city: z.string() })).query(async ({ input }) => {
    return (await getCityEligilityStatus(input.city)) as HeatNetworksResponse; // legacy type for compatibility
  }),
  createNetwork: adminRoute.input(zCreateNetworkInput).mutation(async ({ input, ctx }) => {
    const result = await reseauxService.createNetwork(input.id, input.geometry, input.type);
    await createUserEvent({
      author_id: ctx.user.id,
      context_id: input.id,
      context_type: tableToNetworkEntity[input.type],
      data: { id: input.id, identifiant_reseau: null, nom_reseau: null, type: input.type },
      type: 'network_created',
    });
    return result;
  }),
  deleteGeomUpdate: adminRoute.input(zDeleteGeomUpdateInput).mutation(async ({ input }) => {
    return await reseauxService.deleteGeomUpdate(input.id, input.type);
  }),
  deleteNetwork: adminRoute.input(zDeleteNetworkInput).mutation(async ({ input, ctx }) => {
    const reseau = await reseauxService.getNetworkLabel(input.id, input.type);
    const result = await reseauxService.deleteNetwork(input.id, input.type);

    // Remove now-dangling permissions so users don't keep access to a deleted network.
    const permissionType = networkPermissionType(input.type);
    if (permissionType) {
      await removeNetworkPermissionFromAllUsers(permissionType, String(input.id), ctx.user.id);
    }

    await createUserEvent({
      author_id: ctx.user.id,
      context_id: String(input.id),
      context_type: tableToNetworkEntity[input.type],
      data: {
        id: input.id,
        identifiant_reseau: reseau.identifiant_reseau,
        nom_reseau: reseau.nom_reseau,
        type: input.type,
      },
      type: 'network_deleted',
    });
    return result;
  }),
  eligibilityStatus: route.input(z.object({ lat: z.number(), lon: z.number() })).query(async ({ input }) => {
    return (await getEligilityStatus(input.lat, input.lon)) as HeatNetworksResponse; // legacy type for compatibility
  }),
  // Routes publiques pour l'éligibilité et la recherche de réseaux
  getNetworkEligibilityStatus: route.input(zGetNetworkEligibilityStatusInput).query(async ({ input }) => {
    return await getNetworkEligilityStatus(input.networkId, input.lat, input.lon);
  }),
  getNetworkGeometry: route.input(zDownloadNetworkGeometryInput).query(async ({ input }) => {
    return await reseauxService.getNetworkGeometry(input.type, input.id);
  }),
  // Lists users whose permissions reference this network (to warn before deletion).
  getNetworkLinkedUsers: adminRoute.input(zDeleteNetworkInput).query(async ({ input }) => {
    const type = networkPermissionType(input.type);
    if (!type) {
      return [];
    }
    return await getUsersWithNetworkPermission(type, String(input.id));
  }),
  // Route publique pour lister tous les réseaux (utilisé pour la comparaison)
  listNetworks: route.query(async () => {
    return await reseauxService.listNetworks();
  }),
  /**
   * Limites min/max sur les dimensions filtrables des réseaux de chaleur.
   * Utilisé par `useMapConfiguration` côté carte pour initialiser les filtres
   * (`MapConfiguration.reseauxDeChaleur.limits`).
   *
   * Les noms de colonnes sont typés via `eb.fn.min`/`max` contre le schéma
   * Kysely (`reseaux_de_chaleur`) — un rename de colonne casse à la compile.
   */
  networkLimits: route.query(async (): Promise<ReseauxDeChaleurLimits> => {
    const row = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select((eb) => [
        eb.fn.min<number>('Taux EnR&R').as('tauxENRR_min'),
        eb.fn.max<number>('Taux EnR&R').as('tauxENRR_max'),
        sql<number>`${eb.fn.min('contenu CO2 ACV')} * 1000`.as('emissionsCO2_min'),
        sql<number>`${eb.fn.max('contenu CO2 ACV')} * 1000`.as('emissionsCO2_max'),
        sql<number>`${eb.fn.min('contenu CO2')} * 1000`.as('contenuCO2_min'),
        sql<number>`${eb.fn.max('contenu CO2')} * 1000`.as('contenuCO2_max'),
        sql<number>`floor(${eb.fn.min('PM')})`.as('prixMoyen_min'),
        sql<number>`ceil(${eb.fn.max('PM')})`.as('prixMoyen_max'),
        sql<number>`floor(${eb.fn.min('livraisons_totale_MWh')} / 1000)`.as('livraisonsAnnuelles_min'),
        sql<number>`ceil(${eb.fn.max('livraisons_totale_MWh')} / 1000)`.as('livraisonsAnnuelles_max'),
        eb.fn.min<number>('annee_creation').as('anneeConstruction_min'),
        sql<number>`extract(year from now())`.as('anneeConstruction_max'),
      ])
      .executeTakeFirstOrThrow();

    return {
      anneeConstruction: [row.anneeConstruction_min, row.anneeConstruction_max],
      contenuCO2: [row.contenuCO2_min, row.contenuCO2_max],
      emissionsCO2: [row.emissionsCO2_min, row.emissionsCO2_max],
      livraisonsAnnuelles: [row.livraisonsAnnuelles_min, row.livraisonsAnnuelles_max],
      prixMoyen: [row.prixMoyen_min, row.prixMoyen_max],
      tauxENRR: [row.tauxENRR_min, row.tauxENRR_max],
    };
  }),
  networkReminders: networkRemindersRouter,
  perimetreDeDeveloppementPrioritaire: perimetreDeDeveloppementPrioritaireRouter,
  // Sous-routeurs par type
  reseauDeChaleur: reseauDeChaleurRouter,
  reseauDeFroid: reseauDeFroidRouter,
  reseauEnConstruction: reseauEnConstructionRouter,
  /**
   * Recherche publique de réseaux (de chaleur existants + en construction) par
   * nom, identifiant SNCU ou id_fcu. Renvoie la bbox PostGIS de chaque réseau
   * pour que la carte puisse `fitBounds` sur le résultat sélectionné.
   *
   * Distinct de `searchNetworks` (admin) : ce dernier ne contient pas la bbox
   * et est limité à des rôles authentifiés ; celui-ci est public et map-centric.
   */
  searchForMap: route.input(z.object({ search: z.string().min(2).max(100) })).query(async ({ input }) => {
    return await reseauxService.searchNetworksForMap(input.search);
  }),
  searchNetworks: demandAccessRoute.input(z.object({ search: z.string().min(2).max(100) })).query(async ({ input }) => {
    return await reseauxService.searchNetworks(input.search);
  }),
  searchOperators: route
    .input(z.object({ field: z.enum(['gestionnaire', 'maitreOuvrage']), search: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      return await reseauxService.searchNetworkOperators(input.field, input.search);
    }),

  // Opérations communes à tous les types
  updateGeomUpdate: adminRoute.input(zUpdateGeomUpdateInput).mutation(async ({ input, ctx }) => {
    const reseau = await reseauxService.getNetworkLabel(input.id, input.type);
    const result = await reseauxService.updateGeomUpdate(input.id, input.geometry, input.type);
    await createUserEvent({
      author_id: ctx.user.id,
      context_id: String(input.id),
      context_type: tableToNetworkEntity[input.type],
      data: {
        id: input.id,
        identifiant_reseau: reseau.identifiant_reseau,
        nom_reseau: reseau.nom_reseau,
        type: input.type,
      },
      type: 'network_geometry_updated',
    });
    return result;
  }),
});
