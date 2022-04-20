// read file

import fs from 'fs';

import splitFile from 'split-file';

function lightenJsonFile(inputPath, filenames, outputPath, filter, debug = '') {
  debug &&
    console.info(
      'JsonFile system reading...',
      typeof debug === 'string' ? `[${debug}]` : '',
      `(${inputPath})`
    );
  const rawdata = fs.readFileSync(inputPath).toString();
  debug && console.info('Convert string to Json ...');
  const data = JSON.parse(rawdata);
  debug && console.info('File read.');

  // Filter =>
  console.log('data.features.length =>', data.features.length);
  const newFeatures = filter ? data.features.filter(filter) : data.features;
  console.log('newFeatures.length =>', newFeatures.length);
  data.features = newFeatures;

  fs.writeFileSync(outputPath, JSON.stringify(data));
  return data;
}

// ---

// Async Split File :
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

// ------

// Read SplitenFiles list and convert to JSON :
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

// ------

// List fileName of SplitenFile in directory :
const readSplitedFileName = (dir, fileName) => {
  const testRegEx = new RegExp(`^${fileName}[.]sf-part(?:[0-9]+)`);
  console.log(fs.readdirSync(dir));
  const files = fs
    .readdirSync(dir)
    .filter((_fileName) => testRegEx.test(_fileName));
  console.log('files =>', files);
};

// ------

// read geojson file
const pathDir = 'public/geojson/';
const inputDirs = 'source.backUp/';
const outputDir = '';

// const energyOK = ['fioul_domestique', 'gaz_naturel', 'gaz_propane_butane'];
// const fileName = 'registre_copro.geojson';
// const filter = ({ geometry, properties }) =>
//   !!geometry && energyOK.includes(properties?.energie_utilisee);

// const fileName = 'conso_gaz.geojson';
// const filter = ({ geometry }) => !!geometry;

const energyOK = ['fioul_domestique', 'gaz_naturel', 'gaz_propane_butane'];
const fileNames = ['registre_copro.geojson', 'conso_gaz.geojson'];
const filters = [
  ({ geometry, properties }) =>
    !!geometry && energyOK.includes(properties?.energie_utilisee),
  ({ geometry }) => !!geometry,
];
const outputFilename = 'energy.geojson';

// readSplitedFileName(pathDir, fileNames);

lightenJsonFile(
  `${pathDir}${inputDir}`,
  fileNames,
  `${pathDir}${outputDir}${fileName}`,
  filter,
  true
);
const convertedDataFiles = splitData(
  `${pathDir}${outputDir}${fileName}`,
  1000000 * 5
).then((arrayFiles) => {
  const jsonData = splitFileToData(arrayFiles);
  console.log('Data converted ==>', typeof jsonData);
});

console.log('arrayFiles =>', typeof convertedDataFiles);
