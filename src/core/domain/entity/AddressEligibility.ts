import { Address } from '@core/domain/entity/address';
import { Network } from '@core/domain/entity/network';

export class AddressEligibility {
  constructor(
    public address: Address,
    public network: Network,
    public isEligible: boolean
  ) {}
}
