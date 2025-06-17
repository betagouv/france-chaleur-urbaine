import knex from 'knex';

import { logger } from '@/server/helpers/logger';
import config from '@root/knexfile';

const serverName = (config.connection?.match(/@([^/]+)/) ?? [])[1];
logger.warn('connecting to database', serverName);

/**
 * @deprecated use kdb instead
 */
export default knex(config);
