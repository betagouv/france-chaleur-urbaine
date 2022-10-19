import cron from 'cron';
import { launchJob } from './launch';

new cron.CronJob({
  cronTime: '00 10 * * 1-5', // du lundi au vendredi à 10:00
  onTick: () => launchJob('dailyManagerMail'),
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
