import { Coords } from '@core/domain/entity/address';

export class RepositoryError extends Error {
  constructor(reason: any) {
    super(reason);
  }
}
export class AddressNotFoundError extends Error {
  public code: string;
  constructor(coords: Coords, err?: string) {
    super(
      `no address found for theses coords : ${JSON.stringify(coords)}${
        err ? ` (${err})` : ''
      }`
    );
    this.code = 'Address Not Found';
  }
}
export class AppError extends Error {
  constructor(reason: any) {
    super(reason);
  }
}
