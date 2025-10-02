export class ServiceError extends Error {
  // biome-ignore lint/complexity/noUselessConstructor: c'est utile pour typescript pour passer un argument
  constructor(reason: any) {
    super(reason);
  }
}
