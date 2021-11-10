import { Address, Coords } from '@core/domain/entity/address';
import { AddressFactory } from '@core/domain/entity/AddressFactory';
import { AddressNotFoundError } from '@core/domain/errors';
import { AddressRepository } from '@core/domain/repository/addressRepository';
import { HttpClient } from '../../domain/lib';
import { AddressPyrisResponse } from '../mapper/address.dto';
import AddressMapper from '../mapper/addressMapper';

export class AddressRepositoryImpl implements AddressRepository {
  constructor(private httpClient: HttpClient) {}

  async findByCoords(coords: Coords): Promise<Address> {
    return this.httpClient
      .get<AddressPyrisResponse>(
        `${process.env.NEXT_PUBLIC_PYRIS_BASE_URL}coords?geojson=false&lat=${coords.lat}&lon=${coords.lon}`
      )
      .then((addressRaw) => {
        const mappedAddress = AddressMapper.toDomain({
          ...addressRaw,
          lat: coords.lat,
          lon: coords.lon,
        });
        return AddressFactory.create(mappedAddress);
      })
      .catch((err) => {
        throw new AddressNotFoundError(coords, err);
      });
  }
}
