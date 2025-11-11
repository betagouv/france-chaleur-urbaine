import { faker } from '@faker-js/faker';
import { sql } from 'kysely';
import type { User } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import * as demandsService from '@/modules/demands/server/demands-service';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import db from '@/server/db';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { invalidPermissionsError } from '@/server/helpers/server';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import type { Demand } from '@/types/Summary/Demand';
import type { User as FullUser } from '@/types/User';

export const getAllDemands = async (): Promise<Demand[]> => {
  const records = (await kdb.selectFrom('demands').selectAll().orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute()).map(
    ({ id, legacy_values }) => ({
      fields: legacy_values,
      id,
    })
  );
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getAllNewDemands = async (): Promise<Demand[]> => {
  const records = (
    await kdb
      .selectFrom('demands')
      .selectAll()
      .where(sql`legacy_values->>'Gestionnaires validés'`, '=', 'true')
      .where((eb) =>
        eb.or([eb(sql`legacy_values->>'Notification envoyé'`, '=', ''), eb(sql`legacy_values->>'Notification envoyé'`, 'is', null)])
      )
      .execute()
  ).map(({ id, legacy_values }) => ({
    fields: legacy_values,
    id,
  }));
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getAllToRelanceDemands = async (): Promise<Demand[]> => {
  const records = (
    await kdb
      .selectFrom('demands')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb.and([
            eb(sql`(legacy_values->>'Date de la demande')::date`, '<', sql`NOW() - INTERVAL '1 month'`),
            eb(sql`legacy_values->>'Relance à activer'`, '=', 'true'),
            eb.or([
              eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, '=', ''),
              eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, 'is', null),
            ]),
            eb.or([eb(sql`legacy_values->>'Relance envoyée'`, '=', ''), eb(sql`legacy_values->>'Relance envoyée'`, 'is', null)]),
          ]),
          eb.and([
            eb(sql`(legacy_values->>'Date de la demande')::date`, '<', sql`NOW() - INTERVAL '45 days'`),
            eb.or([
              eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, '=', ''),
              eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, 'is', null),
            ]),
            eb(sql`legacy_values->>'Relance à activer'`, '=', 'true'),
            eb(sql`legacy_values->>'Relance envoyée'`, '!=', ''),
            eb(sql`legacy_values->>'Relance envoyée'`, 'is not', null),
            eb.or([
              eb(sql`legacy_values->>'Seconde relance envoyée'`, '=', ''),
              eb(sql`legacy_values->>'Seconde relance envoyée'`, 'is', null),
            ]),
          ]),
        ])
      )
      .execute()
  ).map(({ id, legacy_values }) => ({
    fields: legacy_values,
    id,
  }));
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getToRelanceDemand = async (id: string): Promise<Demand | undefined> => {
  const records = (await kdb.selectFrom('demands').selectAll().where(sql`legacy_values->>'Relance ID'`, '=', id).execute()).map(
    ({ id, legacy_values }) => ({
      fields: legacy_values,
      id,
    })
  );
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand)[0];
};

export const getAllStaledDemandsSince = async (dateDiff: number): Promise<Demand[]> => {
  const records = (
    await kdb
      .selectFrom('demands')
      .selectAll()
      .where(sql`(legacy_values->>'Notification envoyé')::date`, '<', sql`NOW() + INTERVAL '${sql.raw(dateDiff.toString())} days'`)
      .where((eb) =>
        eb.or([
          eb(sql`legacy_values->>'Status'`, '=', ''),
          eb(sql`legacy_values->>'Status'`, 'is', null),
          eb(sql`legacy_values->>'Status'`, '=', 'En attente de prise en charge'),
        ])
      )
      .execute()
  ).map(({ id, legacy_values }) => ({
    fields: legacy_values,
    id,
  }));
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getGestionnairesDemands = async (gestionnaires: string[]): Promise<Demand[]> => {
  const records = (
    await kdb
      .selectFrom('demands')
      .selectAll()
      .where(sql`legacy_values->>'Gestionnaires validés'`, '=', 'true')
      .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
      .execute()
  ).map(({ id, legacy_values }) => ({
    fields: legacy_values,
    id,
  }));

  return records
    .map((record) => ({ id: record.id, ...record.fields }) as Demand)
    .filter((record) => record.Gestionnaires?.some((gestionnaire) => gestionnaires.includes(gestionnaire)));
};

export const getDemands = async (user: User): Promise<Demand[]> => {
  if (!user || !user.gestionnaires) {
    return [];
  }

  const startTime = Date.now();

  // Build query based on user role and gestionnaires
  let query = kdb.selectFrom('demands').selectAll();

  if (user.role === 'admin') {
    // No filter for admin
  } else if (user.role === 'demo') {
    query = query
      .where(sql`legacy_values->>'Gestionnaires validés'`, '=', 'true')
      .where(sql`legacy_values->'Gestionnaires'`, '?|', sql.raw(`ARRAY['Paris']`));
  } else if (user.role === 'gestionnaire') {
    query = query
      .where(sql`legacy_values->>'Gestionnaires validés'`, '=', 'true')
      .where(
        sql`legacy_values->'Gestionnaires'`,
        '?|',
        sql.raw(`ARRAY[${user.gestionnaires.map((gestionnaire) => `'${gestionnaire.replace(/'/g, "''")}'`).join(',')}]`)
      );
  }

  const records = (await query.orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute()).map(({ id, legacy_values }) => ({
    fields: legacy_values,
    id,
  }));

  logger.info('kdb.getDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
    tagsCounts: user.gestionnaires.length,
  });

  records.forEach((record) => {
    // ajoute le champ haut_potentiel = en chauffage collectif avec : soit à -100m hors Paris / -60m Paris, soit +100 logements, soit tertiaire.
    const fields = record.fields as Demand;
    const isParis = fields.Gestionnaires?.includes('Paris');
    const distanceThreshold = isParis ? 60 : 100;
    fields.haut_potentiel =
      fields['Type de chauffage'] === 'Collectif' &&
      (fields['Distance au réseau'] < distanceThreshold || fields.Logement >= 100 || fields.Structure === 'Tertiaire');

    // complète les valeurs par défaut pour simplifier l'usage côté UI
    fields['Prise de contact'] ??= false;
    fields.Status ??= DEMANDE_STATUS.EMPTY;
  });

  return user.role === 'demo'
    ? records.map(
        (record) =>
          ({
            id: record.id,
            ...record.fields,
            Mail: faker.internet.email(),
            Nom: faker.person.lastName(),
            Prénom: faker.person.firstName(),
            Téléphone: `0${faker.string.numeric(9)}`,
          }) as Demand
      )
    : records.map(
        (record) =>
          ({
            id: record.id,
            ...record.fields,
          }) as Demand
      );
};

const getDemand = async (user: User, demandId: string): Promise<Demand> => {
  const record = await kdb.selectFrom('demands').selectAll().where('id', '=', demandId).executeTakeFirstOrThrow();
  const gestionnaires = record.legacy_values.Gestionnaires as string[];
  if (user.role !== 'admin' && !gestionnaires.some((gestionnaire) => user.gestionnaires?.includes(gestionnaire))) {
    throw invalidPermissionsError;
  }
  return { id: record.id, ...record.legacy_values } as Demand;
};

export const updateDemand = async (user: User, demandId: string, updateData: Partial<Demand>): Promise<Demand | null> => {
  // check permissions
  await getDemand(user, demandId);

  const record = await demandsService.update(demandId, updateData);

  // legacy check, may be obsolete as errors seem to be thrown by the Airtable API
  const error = (record as any)?.error;
  if (error) {
    throw new Error(error);
  }
  await createUserEvent({
    author_id: user.id,
    context_id: demandId,
    context_type: 'demand',
    data: updateData,
    type: 'demand_updated',
  });
  return record as Demand;
};

const groupDemands = (demands: Demand[]): Record<string, Demand[]> => {
  const groupedDemands: Record<string, Demand[]> = {};
  demands
    .filter((demand) => demand.Gestionnaires)
    .forEach((demand) =>
      demand.Gestionnaires.forEach((gestionnaire) => {
        if (groupedDemands[gestionnaire]) {
          groupedDemands[gestionnaire].push(demand);
        } else {
          groupedDemands[gestionnaire] = [demand];
        }
      })
    );
  return groupedDemands;
};

const groupUsers = (users: FullUser[], extraFilter: (user: FullUser) => boolean): Record<string, string[]> => {
  const groupedUsers: Record<string, string[]> = {};
  users
    .filter((user) => user.email.includes('@'))
    .filter(extraFilter)
    .forEach((user) => {
      user.gestionnaires.forEach((gestionnaire) => {
        if (groupedUsers[gestionnaire]) {
          groupedUsers[gestionnaire].push(user.email);
        } else {
          groupedUsers[gestionnaire] = [user.email];
        }
      });
    });
  return groupedUsers;
};

const newDemands = async (users: FullUser[]) => {
  const sent: string[] = [];
  const groupedUsers = groupUsers(users, (user) => user.receive_new_demands);

  const demands = await getAllNewDemands();
  const groupedDemands = groupDemands(demands);

  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (const email of gestionnaireUsers) {
      if (!sent.includes(email)) {
        await sendEmailTemplate('demands.gestionnaire-new', { email, id: 'unknown' }, { nbDemands: groupedDemands[gestionnaire].length });
        sent.push(email);
      }
      if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION !== 'true') {
        await Promise.all(
          groupedDemands[gestionnaire].map((demand) =>
            demandsService.update(demand.id, {
              'Notification envoyé': new Date().toDateString(),
            })
          )
        );
      }
    }
  }

  console.info(`${sent.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};

const oldDemands = async (users: FullUser[]) => {
  const sent: string[] = [];
  const groupedUsers = groupUsers(users, (user) => user.receive_old_demands);
  const demands = await getAllStaledDemandsSince(-7);
  const groupedDemands = groupDemands(demands);

  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (const email of gestionnaireUsers) {
      if (!sent.includes(email)) {
        await sendEmailTemplate('demands.gestionnaire-old', { email, id: 'unknown' });
        sent.push(email);
      }
    }
  }

  console.info(`${sent.length} email(s) envoyé(s) pour les vieilles demandes.`);
};

/**
 * Envoie un email de relance aux gestionnaires qui ont des demandes en attente de prise en charge
 * depuis plus de 7 jours.
 */
export const weeklyOldManagerMail = async () => {
  const users: FullUser[] = await db('users')
    .where('active', true)
    .select('gestionnaires', 'email', 'receive_new_demands', 'receive_old_demands');

  await oldDemands(users);
};

/**
 * Envoie un email pour notifier les gestionnaires de nouvelles demandes.
 */
export const dailyNewManagerMail = async () => {
  const users: FullUser[] = await db('users')
    .where('active', true)
    .select('gestionnaires', 'email', 'receive_new_demands', 'receive_old_demands');

  await newDemands(users);
};

/**
 * Envoie des relances aux utilisateurs s'ils n'ont pas été recontactés par le gestionnaire
 * après 1 mois pour la première relance
 * puis 15 jours plus tard pour la seconde relance
 */
export const dailyRelanceMail = async () => {
  const demands = await getAllToRelanceDemands();
  for (const demand of demands) {
    const relanced = demand['Relance envoyée'];
    const uuid = uuidv4();
    await demandsService.update(demand.id, {
      [relanced ? 'Seconde relance envoyée' : 'Relance envoyée']: new Date().toDateString(),
      'Relance ID': uuid,
    });
    await sendEmailTemplate(
      'demands.user-relance',
      { email: demand.Mail, id: demand.id },
      {
        adresse: demand.Adresse,
        date: new Date(demand['Date de la demande']).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        firstName: demand.Prénom ?? '',
        id: uuid,
      }
    );
  }
};
