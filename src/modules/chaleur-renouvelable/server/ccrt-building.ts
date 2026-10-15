import { TRPCError } from '@trpc/server';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { createUserEvent } from '@/modules/events/server/service';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';
import { ObjectKeys } from '@/utils/typescript';

import { getAlternativeHeatingSolutionLabels, getModesDeChauffage } from '../client/heating-modes/selectors';
import { buildSimulationSituation } from '../client/simulation-situation';
import {
  MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
  normalizeModeEauChaudeSanitaireForTypeLogement,
  zCcrtBuilding,
  type zCcrtUpdateBuilding,
} from '../constants';
import { ensureCcrtDemandAccess, getCcrtTerritory } from './ccrt-access';
import { getCcrtServerTrackingProperties, recordCcrtPostHogEvent } from './ccrt-tracking';
import { getAddressEligibilityContext } from './service';

/**
 * Applies the existing simulator rules on the server and saves a coherent building, ranking and result URL.
 */
export const updateCcrtBuilding = async (ctx: Context, input: z.infer<typeof zCcrtUpdateBuilding>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const hotWaterMode = normalizeModeEauChaudeSanitaireForTypeLogement(input.values.hot_water_system_type, input.values.housing_type);
  const values = {
    ...input.values,
    annual_heating_consumption: input.values.annual_heating_consumption ?? null,
    hot_water_system_type: hotWaterMode === MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE ? null : hotWaterMode,
    surface_area: input.values.surface_area ?? null,
  };
  const searchResult = await fetchJSON<{
    features: { properties: { id: string; city: string; citycode: string }; geometry: { coordinates: [number, number] } }[];
  }>(`${serverConfig.banApiBaseUrl}search`, { params: { limit: 1, q: demand.address } });
  const address = searchResult.features[0];
  if (!address) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette adresse ne permet pas de recalculer les solutions. Veuillez la vérifier.' });
  }
  const context = await getAddressEligibilityContext({
    banId: address.properties.id,
    city: address.properties.city,
    cityCode: address.properties.citycode,
    lat: address.geometry.coordinates[1],
    lon: address.geometry.coordinates[0],
    selectedBatimentConstructionId: demand.batiment_construction_id,
  });
  const params = {
    adresse: demand.address,
    constructionId: context.selectedBatEnrBatiment?.batiment_construction_id ?? null,
    dpe: values.dpe,
    espaceExterieur: values.outdoor_space,
    habitantsMoyen: String(values.average_residents),
    modeEauChaudeSanitaire: values.hot_water_system_type ?? MODE_EAU_CHAUDE_SANITAIRE_NON_RENSEIGNE,
    nbLogements: values.housing_count,
    originDemandId: demand.origin_demand_id,
    surfaceMoyenne: values.average_area,
    typeLogement: values.housing_type,
    typeRadiateur: values.radiator_type,
  } satisfies Parameters<typeof buildSimulationSituation>[0]['params'];
  const situation = buildSimulationSituation({ ...context, params });
  const solutions = getAlternativeHeatingSolutionLabels(getModesDeChauffage(values.housing_type, situation));
  const query = new URLSearchParams();
  Object.entries({ ...params, construction_id: params.constructionId }).forEach(([key, value]) => {
    if (key !== 'constructionId' && value !== null) {
      query.set(key, String(value));
    }
  });
  const territory = await getCcrtTerritory(address.properties.citycode, context.codeDepartement || demand.departement_code);
  const result = await kdb.transaction().execute(async (transaction) => {
    const previousValues = zCcrtBuilding.parse(demand);
    const changes = Object.fromEntries(
      ObjectKeys(values).flatMap((key) => {
        const value = values[key];
        const previousValue = previousValues[key] ?? null;
        return JSON.stringify(previousValue) === JSON.stringify(value) ? [] : [[key, { from: previousValue, to: value }]];
      })
    );
    const updatedDemand = await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({
        ...values,
        ...territory,
        alternative_heating_solutions: solutions,
        batiment_construction_id: params.constructionId,
        simulation_url: `/chaleur-renouvelable/resultat?${query}`,
        updated_at: new Date(),
      })
      .where('id', '=', input.demandId)
      .where((expression) => sql<boolean>`date_trunc('milliseconds', ${expression.ref('updated_at')}) = ${new Date(input.updatedAt)}`)
      .returning(['id', 'updated_at'])
      .executeTakeFirst();
    if (!updatedDemand) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Cette demande a été modifiée. Rechargez-la avant d’enregistrer vos corrections.' });
    }
    if (Object.keys(changes).length) {
      await createUserEvent(
        { author_id: ctx.user.id, context_id: demand.id, context_type: 'ccrt_demand', data: { changes }, type: 'ccrt_demand_updated' },
        transaction
      );
    }
    return { changes, id: updatedDemand.id, updatedAt: updatedDemand.updated_at.toISOString() };
  });
  const changedFields = Object.keys(result.changes);
  if (changedFields.length > 0) {
    await recordCcrtPostHogEvent({
      distinctId: ctx.user.id,
      event: 'ccrt_demande:building_data_edited',
      properties: {
        ...(await getCcrtServerTrackingProperties(ctx, demand)),
        champs_modifies: changedFields,
        nb_champs_modifies: changedFields.length,
      },
    });
  }
  return { id: result.id, updatedAt: result.updatedAt };
};
