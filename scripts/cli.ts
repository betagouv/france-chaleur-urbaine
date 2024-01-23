import { fetchBaseSchema } from './airtable/dump-schema';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { KnownAirtableBase, knownAirtableBases } from './airtable/bases';
import { downloadNetwork } from './networks/download-network';
import {
  createCommand,
  InvalidArgumentError,
} from '@commander-js/extra-typings';
import { logger } from '@helpers/logger';
import { DataType, tilesInfo } from 'src/services/tiles.config';
import db from 'src/db';

const program = createCommand();

program
  .name('FCU CLI')
  .version('0.1.0')
  .hook('postAction', async () => {
    await db.destroy();
  });

program
  .command('create-modifications-reseau')
  .argument('<airtable_base>', 'Base Airtable', validateKnownAirtableBase)
  .action(async (airtableBase) => {
    await createModificationsReseau(airtableBase);
  });

program
  .command('dump-schema')
  .argument('<airtable_base>', 'Base Airtable', validateKnownAirtableBase)
  .action(async (airtableBase) => {
    await fetchBaseSchema(airtableBase);
  });

program
  .command('download-network')
  .argument('<network-id>', 'Network id', validateNetworkId)
  .action(async (table) => {
    await downloadNetwork(table);
    console.log('the end');
  });

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, async () => {
    logger.warn('Received stop signal');
    process.exit(2);
  });
});

program.parse();

function validateKnownAirtableBase(value: string): KnownAirtableBase {
  if (!(value in knownAirtableBases)) {
    throw new InvalidArgumentError(
      `invalid base "${value}", expected any of ${Object.keys(
        knownAirtableBases
      )}.`
    );
  }
  return value as KnownAirtableBase;
}

function validateNetworkId(value: string): DataType {
  const tileInfo = tilesInfo[value as DataType];
  if (!tileInfo || !(tileInfo as any).airtable) {
    throw new InvalidArgumentError(
      `invalid network id "${value}", expected any of ${Object.keys(
        tilesInfo // minus .airtable property
      )}.`
    );
  }
  return value as DataType;
}
