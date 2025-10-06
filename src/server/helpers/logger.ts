import { createLogger as createWinstonLogger, format, transports } from 'winston';

import { serverConfig } from '@/server/config';

export type { Logger } from 'winston';

/**
 * Colorize inside of the message and display objects as stringified JSON.
 */
const prettyLogsInDev = format((info) => {
  const { timestamp, level, message, name, ...rest } = info;
  const symbols = Object.getOwnPropertySymbols(info);
  const levelSymbol = symbols.find((sym) => sym.toString() === 'Symbol(level)');
  const levelValue = info[levelSymbol as any];
  const [startTag, endTag] = info.level.split(levelValue as string);

  const additionalProps = Object.getOwnPropertyNames(rest).reduce(
    (acc, key) => {
      // get only those which are not a symbol
      acc[key] = info[key];
      return acc;
    },
    {} as { [key: string]: any }
  );

  if (typeof info.message === 'object') {
    info.message = JSON.stringify(info.message, null, 2);
  }

  if (info.name) {
    info.message = `${startTag}[${info.name}]${endTag} ${info.message}`;
  }

  if (process.env.COLORIZE_LOGS === 'true') {
    info.message = `${startTag}${info.message}${endTag}`;
  }

  if (Object.keys(additionalProps).length > 0) {
    info.message = `${info.message} \x1b[90m${JSON.stringify(additionalProps)}\x1b[0m`;
  }
  const formattedTimestamp = new Date(timestamp as string).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  info.message = `\x1b[97m${formattedTimestamp}\x1b[0m ${info.message}`;

  return info;
});

export const logger = createWinstonLogger({
  format:
    process.env.LOGS_PRETTY === 'true'
      ? format.combine(
          format.timestamp(),
          format.colorize(), // Add color to log level and timestamp
          prettyLogsInDev(),
          format.cli() // Apply CLI colorization to other parts of the log
        )
      : format.combine(format.timestamp(), format((info) => ({ ...info, pid: process.pid }))(), format.json()),
  level: serverConfig.LOG_LEVEL,
  transports: [new transports.Console({})],
});

export const parentLogger = logger;

export const createLogger = (name: string, values?: any) =>
  parentLogger.child({
    name,
    values,
  });
