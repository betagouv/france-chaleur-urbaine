import { AddressNotFoundError } from '@core/domain/errors';
import { AddressDTO } from '@core/infrastructure/mapper/address.dto';
import AddressMapper from '@core/infrastructure/mapper/addressMapper';
import { AddressRepositoryImpl } from '@core/infrastructure/repository/AddressRepositoryImpl';
import { axiosHttpClient } from '@core/infrastructure/repository/AxiosHttpClient';
import { NetworkRepositoryImpl } from '@core/infrastructure/repository/networkRepositoryImpl';
import { TestEligibility } from '@core/useCase/testEligibility';
import type { NextApiRequest, NextApiResponse } from 'next';

type ErrorResponse = {
  code: string;
  message: string;
};
export default async function getEligibility(
  req: NextApiRequest,
  res: NextApiResponse<AddressDTO | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(501);
  }
  try {
    const { lat, lon } = req.query as Record<string, string>;

    if (!lat || !lon) {
      res.status(400).json({
        message: 'Parameters lat and lon are required',
        code: 'Bad Arguments',
      });
      return;
    }
    const coords = { lat: Number(lat), lon: Number(lon) };

    const addressRepository = new AddressRepositoryImpl(axiosHttpClient);
    const networkRepository = new NetworkRepositoryImpl(axiosHttpClient);
    const testEligibilityUseCase = new TestEligibility(
      addressRepository,
      networkRepository
    );
    const addressEligibility = await testEligibilityUseCase.check(coords);
    const response = AddressMapper.toDTO(addressEligibility);

    return res.status(200).json({ ...response });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    if (error instanceof AddressNotFoundError) {
      res.status(404).json({ code: error.code, message: error.message });
      return;
    }
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
