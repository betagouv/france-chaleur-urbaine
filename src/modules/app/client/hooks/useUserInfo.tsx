import useLocalStorage from '@/hooks/useLocalStorage';
import type { ContactFormInfos } from '@/types/Summary/Demand';
import type { AvailableHeating } from '../../types';

export type UserInfo = {
  address?: string;
  heatingType?: AvailableHeating;
} & Partial<ContactFormInfos>;

export default function useUserInfo() {
  const { value: userInfo, set } = useLocalStorage<UserInfo>('user-info', {
    defaultValue: {},
  });

  const setUserInfo = (newUserInfo: UserInfo) => {
    const updated = { ...userInfo, ...newUserInfo };
    set(updated);
  };

  return {
    setUserInfo,
    userInfo: userInfo ?? ({} as UserInfo),
  };
}
