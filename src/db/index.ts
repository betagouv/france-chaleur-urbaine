import knex from 'knex';
import config from '../../knexfile';
import { logger } from '@helpers/logger';

const serverName = (config.connection?.match(/@([^/]+)/) ?? [])[1];
logger.warn('connecting to database', serverName);

export default knex(config);
