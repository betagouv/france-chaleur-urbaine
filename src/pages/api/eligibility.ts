import { AppError } from '@core/domain/errors';
import { fetchHttpClient } from '@core/infrastructure/fetchHttpClient';
import { AddressDTO } from '@core/infrastructure/mapper/address.dto';
import AddressMapper from '@core/infrastructure/mapper/addressMapper';
import { HttpAddressRepository } from '@core/infrastructure/repository/httpAddressRepository';
import { TestEligibility } from '@core/useCase/testEligibility';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (
  req: NextApiRequest,
  res: NextApiResponse<AddressDTO | { message: AppError }>
) => {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { lat, lon } = req.query as Record<string, string>;

    if (!lat || !lon) {
      res
        .status(400)
        .json({ message: new AppError('lat and lon params are required') });
      return;
    }
    const coords = { lat: Number(lat), lon: Number(lon) };

    const addressRepository = new HttpAddressRepository(fetchHttpClient);
    const testEligibilityUseCase = new TestEligibility(
      addressRepository,
      fetchHttpClient
    );
    const addressEligibility = await testEligibilityUseCase.check(coords);
    const response = AddressMapper.toDTO(addressEligibility);

    return res.status(200).json({ ...response });
  } catch (e) {
    res.statusCode = 500;
    return res.json({ message: new AppError(e) });
  }
};
/*GET /est-eligibilite?lat=&lon=
 POST /eligibilite, body: {lat, lon} => {estEligible: boolean, ...additionnal}
 GET /address/eligibilite?lat=&lon=*/
