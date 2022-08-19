import { Network } from '@core/domain/entity/network';
import { Address } from './address';

const THRESHOLD = parseInt(process.env.NEXT_THRESHOLD || '0', 10);

export class RegularAddress extends Address {
  private threshold = THRESHOLD;
  get isBasedOnIRIS(): boolean {
    return false;
  }
  isEligibleWith(network: Network): boolean {
    return network?.distance !== null
      ? Number(network.distance) <= this.threshold
      : false;
  }
}
