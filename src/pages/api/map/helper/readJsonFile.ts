import fs from 'fs';

function readJsonFile(filepath: string, debug = '') {
  debug &&
    console.info(
      'JsonFile system reading...',
      typeof debug === 'string' ? `[${debug}]` : '',
      `(${filepath})`
    );
  const rawdata = fs.readFileSync(filepath).toString();
  debug && console.info('Convert string to Json ...');
  const data = JSON.parse(rawdata);
  debug && console.info('File read.');
  return data;
}

export default readJsonFile;
