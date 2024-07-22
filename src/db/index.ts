import knex from 'knex';

import { logger } from '@helpers/logger';

import config from '../../knexfile';

const serverName = (config.connection?.match(/@([^/]+)/) ?? [])[1];
logger.warn('connecting to database', serverName);

export default knex(config);
