import { IsNetwork, Network } from '@core/domain/entity/network';
import { Address } from '.';

export class AddressIdfExcluded extends Address {
  get isIDF(): boolean {
    return false;
  }

  isEligibleWith(network: Network): boolean {
    return IsNetwork(network);
  }
}
