import { AddressNotFoundError } from '@core/domain/errors';
import { AddressRepositoryImpl } from '@core/infrastructure/repository/AddressRepositoryImpl';
import { NetworkRepositoryImpl } from '@core/infrastructure/repository/networkRepositoryImpl';
import { TestEligibility } from '@core/useCase/testEligibility';
import type { NextApiRequest, NextApiResponse } from 'next';
import { axiosHttpClient } from 'src/services/http';
import { ErrorResponse } from 'src/types/ErrorResponse';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';

export default async function eligibilityStatusgibilityStatus(
  req: NextApiRequest,
  res: NextApiResponse<HeatNetworksResponse | ErrorResponse>
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
    const networkRepository = new NetworkRepositoryImpl();
    const testEligibilityUseCase = new TestEligibility(
      addressRepository,
      networkRepository
    );
    const addressEligibility = await testEligibilityUseCase.check(coords);

    return res.status(200).json({
      lat: addressEligibility.address.lat,
      lon: addressEligibility.address.lon,
      isEligible: addressEligibility.isEligible,
      network: addressEligibility.network,
      inZDP: addressEligibility.inZDP,
    });
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
