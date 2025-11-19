import { sql } from 'kysely';
import * as demandsService from '@/modules/demands/server/demands-service';
import { sendEmailTemplate } from '@/modules/email';
import db from '@/server/db';
import { kdb } from '@/server/db/kysely';
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
