import CallOutWithAddress from '@components/EligibilityForm/components/CallOutWithAddress';
import ContactForm from '@components/EligibilityForm/components/ContactForm';
import ContactFormDescription from '@components/EligibilityForm/components/ContactFormDescription';
import {
  ContactFormContentWrapper,
  ContactFormWrapper,
} from '@components/EligibilityForm/components/EligibilityForm.styled';
import { useFormspark } from '@formspark/use-formspark';
import React from 'react';

type EligibilityFormContactType = {
  addressData: Record<string, unknown>;
  onSubmit?: (...arg: any) => void;
  afterSubmit?: (...arg: any) => void;
};

function EligibilityFormContact({
  addressData,
  onSubmit,
  afterSubmit,
}: EligibilityFormContactType) {
  const { geoAddress, eligibility: isAddressEligible }: any = addressData;
  const addressCoords: [number, number] =
    geoAddress?.geometry?.coordinates?.reverse();

  const [submit, submitting] = useFormspark({
    formId: process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID || '',
  });

  const handleSubmitForm = async (values: Record<string, string | number>) => {
    const {
      address,
      coords,
      chauffage: chauffageType,
      network,
    }: Record<string, any> = addressData;
    const storedAddress = JSON.stringify({
      coords: [coords.lat, coords.lon],
      label: address,
    });
    const { chauffage } = values;

    const sendedValues = {
      ...values,
      chauffage: `${chauffage} - ${chauffageType}`,
      address: storedAddress,
      distanceAuReseau: network.distance ? `${network.distance}m` : 'inconnue',
      estEligible: isAddressEligible,
    };

    if (onSubmit) onSubmit(sendedValues);

    await submit(sendedValues).then(
      () => afterSubmit && afterSubmit(sendedValues)
    );
  };

  return (
    <ContactFormWrapper>
      <ContactFormContentWrapper>
        <ContactFormDescription isAddressEligible={isAddressEligible} />
      </ContactFormContentWrapper>
      <ContactFormContentWrapper>
        <CallOutWithAddress
          isAddressEligible={isAddressEligible}
          addressCoords={addressCoords}
        />
        <div className="fr-mt-5w">
          <ContactForm onSubmit={handleSubmitForm} isSubmitting={submitting} />
        </div>
      </ContactFormContentWrapper>
    </ContactFormWrapper>
  );
}

export default EligibilityFormContact;
