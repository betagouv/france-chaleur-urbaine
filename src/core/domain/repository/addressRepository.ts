import { Address, Coords } from '../entity/address';
export interface AddressRepository {
  findByCoords(coords: Coords): Promise<Address>;
}
