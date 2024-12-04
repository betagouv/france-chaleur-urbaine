import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format((info) => ({ ...info, pid: process.pid }))(), format.json()),
  transports: [new transports.Console({})],
});

export const parentLogger = logger;
