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
  const options = {
    hostname: 'example.com',
    port: 443,
    path: '/todos',
    method: 'GET',
  };

  // const req = https.request(options, (res) => {
  const req = https.request(url, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    let tempStr = '';

    res.on('data', (data) => {
      console.log('Data on receive =>', typeof data);
      tempStr = `${tempStr}${data}`;
      //   process.stdout.write(data);
    });
    res.on('end', (data) => {
      console.log('Data received =>', typeof data, typeof tempStr);
      process.stdout.write(tempStr);
    });
  });

  req.on('error', (err) => {
    console.error(err);
  });

  req.end();
};

// export default requestFile;
requestFile();
