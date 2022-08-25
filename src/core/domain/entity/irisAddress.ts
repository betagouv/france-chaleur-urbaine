import { IsNetwork, Network } from '@core/domain/entity/network';
import { Address } from './address';

export class IRISAdress extends Address {
  get isBasedOnIRIS(): boolean {
    return true;
  }

  isEligibleWith(network: Network): boolean {
    return IsNetwork(network);
  }
}
