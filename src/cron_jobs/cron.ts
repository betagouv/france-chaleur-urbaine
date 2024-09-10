import cron from 'cron';

import { launchJob } from './launch';

export function startCronJobs() {
  new cron.CronJob({
    cronTime: '00 10 * * 1-5', // du lundi au vendredi à 10:00
    onTick: () => launchJob('dailyNewManagerMail'),
    start: true,
    timeZone: 'Europe/Paris',
  });

  new cron.CronJob({
    cronTime: '55 9 * * 2', // le mardi à 09:55
    onTick: () => launchJob('weeklyOldManagerMail'),
    start: true,
    timeZone: 'Europe/Paris',
  });

  new cron.CronJob({
    cronTime: '05 10 * * 1', // le lundi à 10:05
    onTick: () => launchJob('dailyRelanceMail'),
    start: true,
    timeZone: 'Europe/Paris',
  });

  new cron.CronJob({
    cronTime: '00 * * * *', // toutes les heures
    onTick: () => launchJob('updateUsers'),
    start: true,
    timeZone: 'Europe/Paris',
  });

  console.log('-- CRON JOB --- Started cron jobs waiting to get ticked...');
}
