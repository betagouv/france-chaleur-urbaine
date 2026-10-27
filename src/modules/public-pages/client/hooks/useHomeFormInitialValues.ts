import useInitialSearchParam from '@/hooks/useInitialSearchParam';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';

import { type HomeFormValues, heatingTypeToTypeLogement, parseHeatingParam } from '../home-form';

/**
 * Initial state of the home address test: the partner iframe hand-off (`?address=&heating=`)
 * wins over what the visitor entered on a previous visit (`user-info` local storage).
 */
export function useHomeFormInitialValues() {
  const urlAddress = useInitialSearchParam('address');
  const urlHeating = parseHeatingParam(useInitialSearchParam('heating'));
  const { userInfo } = useUserInfo();

  const defaultValues: HomeFormValues = {
    espaceExterieur: 'none',
    geoAddress: undefined,
    typeLogement: heatingTypeToTypeLogement(urlHeating ?? userInfo.heatingType),
    typeRadiateur: '',
  };

  return {
    /** Address only known by its label: prefills the input, the BAN feature is rebuilt separately. */
    addressLabel: urlAddress ?? userInfo.address ?? undefined,
    defaultValues,
    /** Both iframe params present: the eligibility test runs as soon as the address feature is rebuilt. */
    shouldAutoSubmit: Boolean(urlAddress && urlHeating),
    urlHeating,
  };
}
