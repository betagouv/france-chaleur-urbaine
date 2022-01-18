/**
 * Calcul de la distance à un point
 *
 *
 */

import fs from 'fs';

//Constants are defined at the end of the class, in Comptage object.
class Distance {
  static reseau = null;

  static initReseau() {
    console.info('Lecture du fichier réseau ...');
    const rawdata = fs
      .readFileSync(
        './public/geojson/dataset-1641576913364-[Trace-des-reseaux-de-chaleur-en-Ile-de-France].geojson'
      )
      .toString();
    console.info('Parsing le fichier en Json ...');
    const reseau = JSON.parse(rawdata);
    console.info('fichier réseau lu');
    return reseau;
  }

  static getDistance(lat: number, lon: number) {
    console.info(
      'Computing distance between network and ' +
        lat +
        ' lat, ' +
        lon +
        ' longitude'
    );
    const resultDistance = Distance.distanceReseau(lat, lon);
    return {
      msg: 'Distance en metres',
      latOrigin: lat,
      lonOrigin: lon,
      latPointReseau: resultDistance.latmin,
      lonPointReseau: resultDistance.lonmin,
      distPointReseau: Math.floor(resultDistance.dmin),
    };
  }

  static distanceReseau(lat: number, lon: number) {
    let dmin = 100000000;
    let latmin = 0,
      lonmin = 0;

    const dataList = Distance.reseau ? [Distance.reseau] : [];
    dataList.forEach(function (data: any, fileIndex) {
      console.info('processing file ' + fileIndex);

      // Then on features of all files
      let lines;
      if (data) {
        data?.features?.forEach(function (feature: any /*, featureIndex*/) {
          if (feature.geometry.type == 'MultiLineString') {
            lines = feature.geometry.coordinates;
          } else if (feature.geometry.type == 'LineString') {
            lines = [feature.geometry.coordinates];
          } else {
            console.info('Unknown type : ' + feature.geometry.type);
            lines = [];
          }

          // Then on each list of lines. Note that a "line" contains multiple segments
          lines.forEach(function (line: any[] /*, linenb*/) {
            //console.info("feature" + index + "ligne :" + linenb );

            // Then on the points of the line (that will define the end of the segment)
            // Le premier point ne constitue pas un segment
            let isSegment = false;
            let lat1 = 0;
            let lon1 = 0;
            line.forEach(function (point /*, segmentNb*/) {
              const closestPoint = Distance.distance(
                lat,
                lon,
                point[1],
                point[0],
                isSegment,
                lat1,
                lon1
              );

              //console.info("feature" + index + "ligne :" + linenb + ", segment : ", segmentNb + "  => d="+d);
              if (closestPoint.d < dmin) {
                // console.info("file index : " + fileIndex + " , feature" + featureIndex +"ligne :" + linenb + ", segment : ", segmentNb +
                //   "  trouvé plus prêt : " + closestPoint.d + " mètres (avant "+dmin + "), long = " + point[0] + " , lat=" + point[1]);
                dmin = closestPoint.d;
                latmin = closestPoint.lat;
                lonmin = closestPoint.lon;
              }
              // Pour les suivants on aura un segment en utilisant le point précédent comme second point
              isSegment = true;
              lat1 = point[1];
              lon1 = point[0];
            });
          });
        });
      }
    });

    console.info(new Date() + 'Fin de la recherche du point le plus proche ');
    console.info('La distance minimale est ' + dmin + ' mètres.');
    return { dmin: dmin, latmin: latmin, lonmin: lonmin };
  }

  //Returns the distance between the  point P0 and the segment P1P2 defined by lat1,lon1 + lat2,lon2
  // This function returns the distance + the point the distance is related to (P1, P2 or a point in the segment)
  //When the shortest distance is not a point INSIDE the segment, P1 or P2 is returned (the closest one)
  //When isSegment is false, returns the distance from P0 to lat1,lon1
  static distance(
    latp: number,
    lonp: number,
    lat1: number,
    lon1: number,
    isSegment: boolean,
    lat2: number,
    lon2: number
  ) {
    const R = 6371e3; // metres
    const latP0Radian = (latp * Math.PI) / 180; // φ, λ in radians
    const LatP1Radian = (lat1 * Math.PI) / 180;
    const deltaLatP1 = ((lat1 - latp) * Math.PI) / 180;
    const deltaLonP1 = ((lon1 - lonp) * Math.PI) / 180;
    const x1 = deltaLonP1 * Math.cos((latP0Radian + LatP1Radian) / 2);
    const y1 = deltaLatP1;

    let d, lat, lon;

    if (!isSegment) {
      d = Math.sqrt(x1 * x1 + y1 * y1) * R;
      lat = lat1;
      lon = lon1;
    } else {
      const delatLatP2 = ((lat2 - latp) * Math.PI) / 180;
      const delatLonP2 = ((lon2 - lonp) * Math.PI) / 180;

      // Use latP1Radian to be consistant with previous projection (dont use latP2Radian)
      const x2 = delatLonP2 * Math.cos((latP0Radian + LatP1Radian) / 2);
      const y2 = delatLatP2;

      const deltaX = x2 - x1;
      const deltaY = y2 - y1;

      // on pose (en vecteurs) P1M= k *  P1P2. M est sur le segment [P1P2] ssi k est entre 0 et1
      // En posant P0M orthogonal à P1P2  (produit scalaire nul) et en résolvant pour k, on aboutit à la valeur de k suivante
      const k =
        -(x1 * deltaX + y1 * deltaY) / (deltaX * deltaX + deltaY * deltaY);
      if (k >= 0 && k <= 1) {
        const x = x1 + k * deltaX;
        const y = y1 + k * deltaY;
        d = Math.sqrt(x * x + y * y) * R;
        lat = (y * 180) / Math.PI + latp;
        lon =
          ((x / Math.cos((latP0Radian + LatP1Radian) / 2)) * 180) / Math.PI +
          lonp;
      } else if (k <= 0) {
        // Point M est coté P1. P1 sera le plus près
        d = Math.sqrt(x1 * x1 + y1 * y1) * R;
        lat = lat1;
        lon = lon1;
      } else {
        // k est >=1, Point M est coté. P2 sera le plus près
        d = Math.sqrt(x2 * x2 + y2 * y2) * R;
        lat = lat2;
        lon = lon2;
      }

      //console.info("dif lat:  y=" + R*deltaphi +", dif lon x=" + R*x);
    }
    return { d: d, lat: lat, lon: lon };
  }
}

Distance.reseau = Distance.initReseau();

export default Distance;
