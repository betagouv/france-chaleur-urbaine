// read file

import fs from 'fs';

// function readJsonFile(filepath, debug = '') {
//   debug &&
//     console.info(
//       'JsonFile system reading...',
//       typeof debug === 'string' ? `[${debug}]` : '',
//       `(${filepath})`
//     );
//   const rawdata = fs.readFileSync(filepath).toString();
//   debug && console.info('Convert string to Json ...');
//   const data = JSON.parse(rawdata);
//   debug && console.info('File read.');
//   return data;
// }

// export default readJsonFile;

// const splitFile = require('split-file');
import splitFile from 'split-file';

function readFile(filepath, debug = '') {
  debug &&
    console.info(
      'File system reading...',
      typeof debug === 'string' ? `[${debug}]` : '',
      `(${filepath})`
    );
  const rawdata = fs.readFileSync(filepath).toString();
  // debug && console.info('Convert string to Json ...');
  // const data = JSON.parse(rawdata);
  debug && console.info('File read.');
  // return data;
  return rawdata;
}

const compressJsonToString = (jsonString, debug) => {
  const rawData = JSON.parse(jsonString);
  const dataString = JSON.stringify(rawData, '');
  debug && console.info('File read. Size =>', dataString.length);
  debug &&
    console.info(
      'rawString size =>',
      dataString.length,
      '/ to =>',
      dataString.length / (1000000 * 20)
    );

  return dataString;
};

const stringChop = (rawStr, size, maxSize) => {
  if (rawStr == null) return [];
  const str = String(rawStr);
  console.log(
    'rawString size =>',
    rawStr.length,
    '/ to =>',
    rawStr.length / (1000000 * 20)
  );
  const result =
    size > 0 ? str.match(new RegExp('.{1,' + size + '}', 'g')) : [str];
  console.log('Cutting file =>', result.length);
  console.log('result.1.length =>', result[1].length);

  maxSize;
  return result;
};

// const stringChop = (rawStr, size) => {
//   if (rawStr == null) return [];
//   const arrRes = [...rawStr];

//   const result = arrRes;

//   console.log('Cutting file =>', result.length);
//   console.log('result.1.length =>', result[1].length);
//   return result;
// };

const splitData = (filePath, maxSizeBytes) => {
  // console.log('__dirname =>', __dirname);

  return (
    splitFile
      // .splitFileBySize(__dirname + '/testfile.bin', 457000)
      .splitFileBySize(filePath, maxSizeBytes)
      .then((names) => {
        console.log(names);
        return names;
      })
      .catch((err) => {
        console.log('Error: ', err);
      })
  );
};

const splitFileToData = (arrayFiles) => {
  // console.log('arrayFiles =>', arrayFiles);
  const rawStr = arrayFiles.reduce(
    (acc, fileName) => `${acc}${fs.readFileSync(fileName)}`,
    ''
  );
  const jsonData = JSON.parse(rawStr);
  console.log(jsonData?.features?.[0]);
  console.log('finish');
  return jsonData;
};

const readSplitFile = (dir, fileName) => {
  const testRegEx = new RegExp(`^${fileName}[.]sf-part(?:[0-9]+)`);
  console.log(fs.readdirSync(dir));
  const files = fs
    .readdirSync(dir)
    .filter((_fileName) => testRegEx.test(_fileName));
  console.log('files =>', files);
};

// read geojson file
const pathDir = 'public/geojson/';
// const fileName = 'registre_copro.geojson';
const fileName = 'conso_gaz.geojson';
// const compressedFileName = 'registre_copro.compress.geojson';

// const jsonString = readFile(`${pathDir}${fileName}`, true);
// const compressedJsonString = compressJsonToString(jsonString, true);

readSplitFile(pathDir, fileName);

const arrayFiles = splitData(`${pathDir}${fileName}`, 1000000 * 5).then(
  (arrayFiles) => {
    const jsonData = splitFileToData(arrayFiles);
  }
);
console.log('arrayFiles =>', typeof arrayFiles);
// splitFileToData(arrayFiles);
// stringChop(compressedJsonString, 1000000, 20);

// fs.writeFile(
//   `${pathDir}${compressedFileName}`,
//   compressedJsonString,
//   function (err) {
//     if (err) return console.error(err);
//     console.info('File write.');
//   }
// );
