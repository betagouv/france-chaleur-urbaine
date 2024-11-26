export class ServiceError extends Error {
  constructor(reason: any) {
    super(reason);
  }
}
