import knex from 'knex';

import { logger } from '@/server/helpers/logger';
import config from '@root/knexfile';

const serverName = (config.connection?.match(/@([^/]+)/) ?? [])[1];
logger.warn('connecting to database', serverName);

export default knex(config);
