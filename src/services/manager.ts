import db from 'src/db';
import base from 'src/db/airtable';
import { Airtable } from 'src/types/enum/Airtable';
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

const newDemands = async (users: User[]) => {
  const sent: string[] = [];
  const groupedUsers = groupUsers(users, (user) => user.receive_new_demands);

  const demands = await getAllNewDemands();
  const groupedDemands = groupDemands(demands);

  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      const email = gestionnaireUsers[i];
      if (!sent.includes(email)) {
        await sendNewDemands(email, groupedDemands[gestionnaire].length);
        sent.push(email);
      }
      if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION !== 'true') {
        await Promise.all(
          groupedDemands[gestionnaire].map((demand) =>
            base(Airtable.UTILISATEURS).update(demand.id, {
              'Notification envoyé': new Date().toDateString(),
            })
          )
        );
      }
    }
  }

  console.log(`${sent.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};

const oldDemands = async (users: User[]) => {
  const sent: string[] = [];
  const groupedUsers = groupUsers(users, (user) => user.receive_old_demands);
  const demands = await getAllStaledDemandsSince(-7);
  const groupedDemands = groupDemands(demands);

  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      const email = gestionnaireUsers[i];
      if (!sent.includes(email)) {
        await sendOldDemands(email);
        sent.push(email);
      }
    }
  }

  console.log(`${sent.length} email(s) envoyé(s) pour les vieilles demandes.`);
};

export const dailyManagerMail = async () => {
  const users: User[] = await db('users').select(
    'gestionnaires',
    'email',
    'receive_new_demands',
    'receive_old_demands'
  );

  await newDemands(users);
  await oldDemands(users);
};
