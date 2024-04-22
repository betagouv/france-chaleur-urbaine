export class ServiceError extends Error {
  constructor(reason: any) {
    super(reason);
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}
