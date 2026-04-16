import { useCallback, useRef } from 'react';

import useLocalStorage from '@/hooks/useLocalStorage';
import type { ContactFormInfos } from '@/modules/demands/constants';

import type { AvailableHeating } from '../../types';

export type UserInfo = {
  address?: string;
  heatingType?: AvailableHeating;
} & Partial<ContactFormInfos>;

export default function useUserInfo() {
  const { value: userInfo, set } = useLocalStorage<UserInfo>('user-info', {
    defaultValue: {},
  });

  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;

  const setUserInfo = useCallback(
    (newUserInfo: UserInfo) => {
      const updated = { ...userInfoRef.current, ...newUserInfo };
      userInfoRef.current = updated;
      set(updated);
    },
    [set]
  );

  return {
    setUserInfo,
    userInfo: userInfo ?? ({} as UserInfo),
  };
}
