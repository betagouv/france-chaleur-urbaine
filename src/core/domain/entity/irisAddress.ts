import { Network } from 'src/types/HeatNetworksResponse';
import { Address } from './address';

export class IRISAdress extends Address {
  get isBasedOnIRIS(): boolean {
    return true;
  }

  isEligibleWith(network: Network): boolean {
    return !!network?.irisCode;
  }
}
