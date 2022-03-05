import fsPromises from 'fs/promises';

const readFileAsync = async (filepath: string, debug = '') => {
  debug &&
    console.info(
      'File system reading...',
      typeof debug === 'string' ? `[${debug}]` : '',
      `(${filepath})`
    );
  const rawdata = await fsPromises.readFile(filepath);
  const data = `${rawdata}`;
  debug && console.info('File read. =>', `${data.length} Byte`);
  return data;
};

export default readFileAsync;
