import { TRPCError } from '@trpc/server';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { createUserEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { ObjectKeys } from '@/utils/typescript';

import type { zCcrtUpdateIdentification } from '../constants';
import { ensureCcrtDemandAccess } from './ccrt-access';

/** Updates identity and contact details without changing the building or its territory. */
export const updateCcrtIdentification = async (ctx: Context, input: z.infer<typeof zCcrtUpdateIdentification>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const values = {
    ...input.values,
    organization_name: input.values.organization_name || null,
    rnic_nom_copropriete: input.values.rnic_nom_copropriete || null,
    rnic_numero_immatriculation: input.values.rnic_numero_immatriculation || null,
    rnic_siret_representant_legal: input.values.rnic_siret_representant_legal || null,
  };
  const changes = Object.fromEntries(
    ObjectKeys(values).flatMap((field) => {
      const from = demand[field] || null;
      const to = values[field] || null;
      return from === to ? [] : [[field, { from, to }]];
    })
  );
  return kdb.transaction().execute(async (transaction) => {
    const updated = await transaction
      .updateTable('demands_chaleur_renouvelable')
      .set({ ...values, updated_at: new Date() })
      .where('id', '=', demand.id)
      .where('archived_at', 'is', null)
      .where((eb) => sql<boolean>`date_trunc('milliseconds', ${eb.ref('updated_at')}) = ${new Date(input.updatedAt)}`)
      .returning(['id', 'updated_at'])
      .executeTakeFirst();
    if (!updated) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Cette demande a été modifiée. Rechargez-la avant d’enregistrer vos corrections.' });
    }
    if (Object.keys(changes).length) {
      await createUserEvent(
        { author_id: ctx.user.id, context_id: demand.id, context_type: 'ccrt_demand', data: { changes }, type: 'ccrt_demand_updated' },
        transaction
      );
    }
    return { id: updated.id, updatedAt: updated.updated_at.toISOString() };
  });
};
