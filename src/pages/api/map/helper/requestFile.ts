// import http from 'http';
import https from 'https';

const defaultUrl =
  'https://france-chaleur-urbaine-pr126.osc-fr1.scalingo.io/geojson/dataset-1642417995651-[Chaufferies-des-reseaux-de-chaleur-en-Ile-de-France].geojson';

// const writeStream;
const requestFile = (url = defaultUrl) => {
  //   http.request(url, (res) => {
  //     // res.pipe(writeStream);
  //     res.toString();
  //   });

  //   const https = require('https')
  // const options = {
  //   hostname: 'example.com',
  //   port: 443,
  //   path: '/todos',
  //   method: 'GET',
  // };

  // const req = https.request(options, (res) => {
  const req = https.request(url, (res) => {
    // console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (data) => {
      console.info('Data received =>', typeof data);
      //   process.stdout.write(data);
    });
  });

  req.on('error', (err) => {
    console.error(err);
  });

  req.end();
};

export default requestFile;
