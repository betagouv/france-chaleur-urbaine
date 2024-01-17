import { fetchBaseSchema } from './airtable/dump-schema';
import { createModificationsReseau } from './airtable/create-modifications-reseau';
import { KnownAirtableBase, knownAirtableBases } from './airtable/bases';

const airtableBase = process.argv[3];
if (!airtableBase || !(airtableBase in knownAirtableBases)) {
  printUsage();
}

// TODO use yargs or commander
const command = process.argv[2];
(async () => {
  try {
    switch (command) {
      case 'create-modifications-reseau':
        await createModificationsReseau(airtableBase as KnownAirtableBase);
        break;
      case 'dump-schema':
        await fetchBaseSchema(airtableBase as KnownAirtableBase);
        break;
      default:
        printUsage();
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
})();

function printUsage() {
  console.info(
    'Usage: npx tsx scripts/cli.ts <create-modifications-reseau|dump-schema> <prod|dev-clemence|dev-maxime>'
  );
  process.exit(1);
}
