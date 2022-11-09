import db from 'src/db';
import base from 'src/db/airtable';
import { Demand } from 'src/types/Summary/Demand';
import { User } from 'src/types/User';
import {
  getAllNewDemands,
  getAllStaledDemandsSince,
} from '../core/infrastructure/repository/manager';
import { sendNewDemands, sendOldDemands } from './email';

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

const groupUsers = (
  users: User[],
  extraFilter: (user: User) => boolean
): Record<string, string[]> => {
  const groupedUsers: Record<string, string[]> = {};
  users
    .filter((user) => user.email.includes('@'))
    .filter(extraFilter)
    .forEach((user) => {
      if (groupedUsers[user.gestionnaire]) {
        groupedUsers[user.gestionnaire].push(user.email);
      } else {
        groupedUsers[user.gestionnaire] = [user.email];
      }
    });
  return groupedUsers;
};

const newDemands = async (users: User[]) => {
  const groupedUsers = groupUsers(users, (user) => user.receive_new_demands);

  const demands = await getAllNewDemands();
  const groupedDemands = groupDemands(demands);

  let count = 0;
  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      count++;
      const email = gestionnaireUsers[i];
      await sendNewDemands(email, groupedDemands[gestionnaire].length);
      if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION !== 'true') {
        await Promise.all(
          groupedDemands[gestionnaire].map((demand) =>
            base('FCU - Utilisateurs').update(demand.id, {
              'Notification envoyé': new Date().toDateString(),
            })
          )
        );
      }
    }
  }

  console.log(`${count} email(s) envoyé(s) pour les nouvelles demandes.`);
};

const oldDemands = async (users: User[]) => {
  const groupedUsers = groupUsers(users, (user) => user.receive_old_demands);
  const demands = await getAllStaledDemandsSince(-7);
  const groupedDemands = groupDemands(demands);

  let count = 0;
  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      count++;
      const email = gestionnaireUsers[i];
      await sendOldDemands(email);
    }
  }

  console.log(`${count} email(s) envoyé(s) pour les vieilles demandes.`);
};

export const dailyManagerMail = async () => {
  const users: User[] = await db('users').select(
    'gestionnaire',
    'email',
    'receive_new_demands',
    'receive_old_demands'
  );

  await newDemands(users);
  await oldDemands(users);
};
