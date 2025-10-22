import { useLocalStorageValue } from '@react-hookz/web';
import type { AvailableHeating } from '../../types';

export default function useUserInfo() {
  const { value: address, set: setAddress } = useLocalStorageValue<string>('user-address', {
    initializeWithValue: false,
  });
  const { value: heatingType, set: setHeatingType } = useLocalStorageValue<AvailableHeating>('user-heating-type', {
    initializeWithValue: false,
  });

  return { address, heatingType, setAddress, setHeatingType };
}
