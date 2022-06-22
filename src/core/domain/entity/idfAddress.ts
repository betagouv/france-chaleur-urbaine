import { Network } from '@core/domain/entity/network';
import { Address } from './.';

const THRESHOLD = parseInt(process.env.NEXT_THRESHOLD || '0', 10);

export class IdfAddress extends Address {
  private threshold = THRESHOLD;
  get isIDF(): boolean {
    return true;
  }
  isEligibleWith(network: Network): boolean {
    return network?.distance !== null
      ? Number(network.distance) <= this.threshold
      : false;
  }
}
