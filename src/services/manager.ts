import db from 'src/db';
import { Demand } from 'src/types/Summary/Demand';
import { getAllDemandsFrom } from '../core/infrastructure/repository/manager';
import { sendNewDemands } from './email';

export const dailyManagerMail = async () => {
  const today = new Date();
  const isMonday = today.getDay() === 1;

  const demands = await getAllDemandsFrom(isMonday ? -3 : -1);
  const users: any[] = await db('users').select('gestionnaire', 'email');

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

  const groupedUsers: Record<string, string[]> = {};
  users
    .filter((user) => user.email.includes('@'))
    .forEach((user) => {
      if (groupedUsers[user.gestionnaire]) {
        groupedUsers[user.gestionnaire].push(user.email);
      } else {
        groupedUsers[user.gestionnaire] = [user.email];
      }
    });

  let count = 0;
  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      count++;
      const email = gestionnaireUsers[i];
      await sendNewDemands(email, groupedDemands[gestionnaire].length);
    }
  }

  console.log(`${count} email(s) envoyé(s).`);
};
