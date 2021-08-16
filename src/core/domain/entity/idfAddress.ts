import { Network } from '@core/domain/entity/network';
import { Address } from './.';

export class IdfAddress extends Address {
  private threshold = 300;
  get isIDF(): boolean {
    return true;
  }
  isEligibleWith(network: Network): boolean {
    return network?.distance
      ? Number(network.distance) <= this.threshold
      : false;
  }
}
