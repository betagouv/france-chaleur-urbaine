import { fillTiles } from './utils/tiles';
import { DatabaseSourceId } from '../src/services/tiles.config';

if (process.argv.length !== 5 && process.argv.length !== 6) {
  console.info('Usage: npx tsx scripts/fillTiles.ts table zoomMin zoomMax [index]');
  process.exit(1);
}

const table = process.argv[2];
const zoomMin = process.argv[3];
const zoomMax = process.argv[4];
const index = process.argv[5];

fillTiles(table as DatabaseSourceId, parseInt(zoomMin), parseInt(zoomMax), index !== undefined);
