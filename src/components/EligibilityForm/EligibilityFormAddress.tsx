import AddressAutocomplete from '@components/addressAutocomplete/AddressAutocomplete';
import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import convertPointToCoordinates from '@utils/convertPointToCoordinates';
import React, { useEffect } from 'react';
import { usePreviousState } from 'src/hooks';
import { useServices } from 'src/services';
import { Coords, Point } from 'src/types';
import { CheckEligibilityFormLabel, SelectEnergy } from './components';

// TODO: Ue generic function ?
const callMarkupEvent = ({
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

// TODO: Ue generic function ?
const callMarkup__handleAddressSelected = (address: string) => {
  matomoEvent(markupData.eligibilityTest.matomoEvent, [address]);
  linkedInEvent(markupData.eligibilityTest.linkedInEvent);
  facebookEvent(markupData.eligibilityTest.facebookEvent);
  googleAdsEvent('10794036298', markupData.eligibilityTest.googleAdsEvent);
};

type CheckEligibilityFormProps = {
  formLabel?: React.ReactNode;
  centredForm?: boolean;
  onChange?: (...arg: any) => void;
  onFetch?: (...arg: any) => void;
  onSuccess?: (...arg: any) => void;
};

const AddressTestForm: React.FC<CheckEligibilityFormProps> = ({
  formLabel,
  centredForm,
  children,
  onChange,
  onFetch,
  onSuccess,
}) => {
  const [status, setStatus] = React.useState('idle');
  const [data, setData] = React.useState({});
  const prevData = usePreviousState(data);
  const { heatNetworkService } = useServices();
  const checkEligibility = React.useCallback(
    async (
      {
        address,
        coords,
        geoAddress,
      }: {
        address?: string;
        coords: Coords;
        geoAddress?: any;
      },
      callback?: ({
        eligibility,
        address,
        coords,
        geoAddress,
      }: {
        eligibility: boolean;
        address?: string;
        coords: Coords;
        geoAddress?: any;
      }) => void
    ) => {
      try {
        setStatus('loading');
        const network = await heatNetworkService.findByCoords(coords);
        const eligibility = network.isEligible;
        setData({ ...data, eligibility, address, coords, geoAddress });
        setStatus('success');
        if (callback) callback({ eligibility, address, coords, geoAddress });
      } catch (e) {
        setStatus('error');
      }
    },
    [data, heatNetworkService]
  );

  const handleAddressSelected = async (
    address: string,
    point: Point,
    geoAddress: any
  ): Promise<void> => {
    if (onFetch) onFetch({ address, point, geoAddress });
    callMarkup__handleAddressSelected(address); // TODO: Move to OnFetch !!!
    const coords: Coords = convertPointToCoordinates(point);
    await checkEligibility({ address, coords, geoAddress }, callMarkupEvent);
  };

  useEffect(() => {
    if (status === 'success' && onSuccess) {
      onSuccess(data);
    }
  }, [data, onSuccess, status]);

  useEffect(() => {
    if (prevData !== data && onChange) {
      onChange(data);
    }
  }, [data, onChange, prevData]);

  return (
    <>
      {children}
      <CheckEligibilityFormLabel centred={centredForm}>
        <SelectEnergy
          name="chauffage"
          selectOptions={{
            collectif: 'Chauffage collectif',
            individuel: 'Chauffage individuel',
          }}
          onChange={(e) => {
            setData({
              ...data,
              chauffage: e.target.value,
            });
          }}
        >
          {formLabel}
        </SelectEnergy>
      </CheckEligibilityFormLabel>
      <AddressAutocomplete
        placeholder="Tapez ici votre adresse"
        onAddressSelected={handleAddressSelected}
      />
    </>
  );
};

export default AddressTestForm;
