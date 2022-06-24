import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import { useCallback, useRef, useState } from 'react';
import { useServices } from 'src/services';
import useBackEndFCU from './useBackEndFCU';

const callMarkup__handleOnFetchAddress = (address: string) => {
  matomoEvent(markupData.eligibilityTest.matomoEvent, [address]);
  linkedInEvent(markupData.eligibilityTest.linkedInEvent);
  facebookEvent(markupData.eligibilityTest.facebookEvent);
  googleAdsEvent('10794036298', markupData.eligibilityTest.googleAdsEvent);
};
const callMarkup__handleOnSuccessAddress = ({
  eligibility,
  address,
}: {
  eligibility: boolean;
  address?: string;
}) => {
  if (eligibility) {
    matomoEvent(markupData.eligibilityTestOK.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestOK.linkedInEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTestOK.googleAdsEvent);
  } else {
    matomoEvent(markupData.eligibilityTestKO.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTestKO.googleAdsEvent);
  }
};
const callMarkup__handleOnSubmitContact = (data: Record<string, any>) => {
  const { estEligible: eligibility, address } = data;
  const markupEligibilityKey = eligibility
    ? 'contactFormEligible'
    : 'contactFormIneligible';
  matomoEvent(markupData[markupEligibilityKey].matomoEvent, [address]);
  facebookEvent(markupData[markupEligibilityKey].facebookEvent);
};

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

const useContactFormFCU = () => {
  const EligibilityFormContactRef = useRef(null);

  const [addressData, setAddressData] = useState({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');
  const [submitToFCU] = useBackEndFCU();
  const { heatNetworkService } = useServices();

  const initAddressData = useCallback((addressDataArg) => {
    setAddressData(addressDataArg);
  }, []);
  const resetContactFormFCU = useCallback((addressDataArg) => {
    setAddressData(addressDataArg || {});
    setContactReady(false);
    setShowWarning(false);
    setMessageSent(false);
    setLoadingStatus('idle');
  }, []);

  const timeoutScroller = useCallback(
    (delai: number, callback?: () => void) =>
      window.setTimeout(() => {
        const { current }: any = EligibilityFormContactRef;
        current?.scrollIntoView({
          behavior: 'smooth',
        });
        if (callback) callback();
      }, delai),
    []
  );

  const handleOnChangeAddress = useCallback((data) => {
    const { address, heatingType } = data;
    setAddressData(data);
    setShowWarning(address && !heatingType);
  }, []);

  const handleOnFetchAddress = useCallback(
    ({ address }) => {
      const { heatingType }: any = addressData;
      setLoadingStatus('loading');
      setMessageSent(false);
      callMarkup__handleOnFetchAddress(address);
      setShowWarning(address && !heatingType);
    },
    [addressData]
  );

  const handleOnSuccessAddress = useCallback(
    (data: any) => {
      const { address, heatingType, eligibility } = data;
      callMarkup__handleOnSuccessAddress({ eligibility, address });
      setAddressData(data);
      if (address && heatingType) {
        setContactReady(true);
        const scrollTimer = timeoutScroller(500, () =>
          setLoadingStatus('loaded')
        );
        return () => window.clearTimeout(scrollTimer);
      }
    },
    [timeoutScroller]
  );

  const handleOnSubmitContact = useCallback(
    async (data: Record<string, any> = {}) => {
      if (data.structure !== 'Tertiaire') data.company = '';
      callMarkup__handleOnSubmitContact(data);
      await submitToFCU(data);
      const scrollTimer = timeoutScroller(500);
      setAddressData({ ...addressData, ...data });
      setMessageSent(true);
      return () => window.clearTimeout(scrollTimer);
    },
    [addressData, submitToFCU, timeoutScroller]
  );

  // TODO: Need move ? :
  const convertAddressBanToFcu = useCallback(
    async ({
      address,
      points,
      geoAddress,
    }): Promise<Record<string, unknown>> => {
      const [lon, lat] = points; // TODO: Fix on source ?

      const coords = { lat, lon };
      const networkData = await heatNetworkService.findByCoords(coords);
      const { isEligible: eligibility, network } = networkData;

      // ------------------------------
      // { ...data, eligibility, address, coords, geoAddress, network }
      // ------------------------------
      //   {
      //     "heatingType": "collectif",
      //     "eligibility": true,
      //     "address": "85 Avenue Foch 75016 Paris",
      //     "coords": {
      //         "lon": 2.275627,
      //         "lat": 48.87095
      //     },
      //     "geoAddress": {
      //         "type": "Feature",
      //         "geometry": {
      //             "type": "Point",
      //             "coordinates": [
      //                 2.275627,
      //                 48.87095
      //             ]
      //         },
      //         "properties": {
      //             "label": "85 Avenue Foch 75016 Paris",
      //             "score": 0.6297687412587413,
      //             "housenumber": "85",
      //             "id": "75116_3696_00085",
      //             "name": "85 Avenue Foch",
      //             "postcode": "75016",
      //             "citycode": "75116",
      //             "x": 646865.43,
      //             "y": 6863679.67,
      //             "city": "Paris",
      //             "district": "Paris 16e Arrondissement",
      //             "context": "75, Paris, Île-de-France",
      //             "type": "housenumber",
      //             "importance": 0.77361,
      //             "street": "Avenue Foch"
      //         }
      //     },
      //     "network": {
      //         "lat": 48.87095573763034,
      //         "lon": 2.275962634547043,
      //         "filiere": null,
      //         "distance": 24,
      //         "irisCode": null
      //     }
      // }
      // ------------------------------

      return {
        // id:
        eligibility,
        address,
        coords,
        points: [coords.lon, coords.lat],
        geoAddress,
        network,
      };
    },
    [heatNetworkService]
  );

  return {
    EligibilityFormContactRef,
    addressData,
    contactReady,
    showWarning,
    messageSent,
    loadingStatus,
    warningMessage,
    convertAddressBanToFcu,
    initAddressData,
    resetContactFormFCU,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
  };
};

export default useContactFormFCU;
