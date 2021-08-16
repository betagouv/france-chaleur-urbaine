import { Coords } from '@core/domain/entity/address';

export class RepositoryError extends Error {
  constructor(reason: any) {
    super(reason);
  }
}
export class AddressNotFoundError extends Error {
  public code: string;
  constructor(coords: Coords) {
    super(`no address found for theses coords : ${coords}`);
    this.code = 'Address Not Found';
  }
}
export class AppError extends Error {
  constructor(reason: any) {
    super(reason);
  }
}
