import fs from 'fs';

export const readSplitFileAsync = async (
  dir: string,
  fileName: string,
  debug: boolean
) => {
  const testRegEx = new RegExp(`^${fileName}[.]sf-part(?:[0-9]+)`);
  debug && console.info(`Directory [${dir}] Parsed =>`, fs.readdirSync(dir));
  const files = fs
    .readdirSync(dir)
    .filter((_fileName) => testRegEx.test(_fileName));
  debug && console.info('files =>', files);
  return files.reduce((acc, _filename) => {
    const fileContent = fs.readFileSync(`${dir}${_filename}`).toString() || '';
    return `${acc}${fileContent}`;
  }, '');
};

export default readSplitFileAsync;
