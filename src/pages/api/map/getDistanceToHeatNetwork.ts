import { NetworkDistance } from '@core/infrastructure/mapper/network.dto';
import Distance from '@core/infrastructure/repository/distance';
import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse<NetworkDistance>) => {
  const slat = !Array.isArray(req.query.lat) ? req.query.lat : req.query.lat[0];
  const slon = !Array.isArray(req.query.lon) ? req.query.lon : req.query.lon[0];
  let lat, lon;

  if (slat == undefined) {
    lat = 48.874;
  } else {
    lat = parseFloat(slat);
  }

  if (slon == undefined) {
    lon = 2.584;
  } else {
    lon = parseFloat(slon);
  }
  const distance = Distance.getDistance(lat, lon);
  res.status(200).json(distance);
};
