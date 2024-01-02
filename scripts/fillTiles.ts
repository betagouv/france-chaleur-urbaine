import { DataType } from '../src/services/tiles.config';
import { fillTiles } from './utils/tiles';

if (process.argv.length !== 5 && process.argv.length !== 6) {
  console.info(
    'Usage: export NODE_PATH=./ && npx tsx scripts/fillTiles.ts table zoomMin zoomMax [index]'
  );
  process.exit(1);
}

const table = process.argv[2];
const zoomMin = process.argv[3];
const zoomMax = process.argv[4];
const index = process.argv[5];

fillTiles(
  table as DataType,
  parseInt(zoomMin),
  parseInt(zoomMax),
  index !== undefined
);
