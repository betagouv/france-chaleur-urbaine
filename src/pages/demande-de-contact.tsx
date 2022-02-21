import ContactForm from '@components/contactForm/contactForm';
import markupData, { facebookEvent, matomoEvent } from '@components/Markup';
import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
import {
  CallOutWithAddress,
  ContactFormContentWrapper,
  ContactFormDescription,
  ContactFormWrapper,
} from '@components/views/ContactView';
import { useFormspark } from '@formspark/use-formspark';
import { useLocalStorageState } from '@utils/useLocalStorage';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const UnderlinedLink = styled.a`
  text-decoration: none;
  color: white;
`;
export default function DemandeDeContact() {
  const { query } = useRouter();
  const [messageSent, setMessageSent] = useState(false);
  const [addressCoords, setAddressCoords] = useState(null);
  const isAddressEligible = query.isEligible === 'true';
  const [storedAddress] = useLocalStorageState('');
  const [submit, submitting] = useFormspark({
    formId: process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID || '',
  });
  const handleSubmitForm = async (values: Record<string, string | number>) => {
    const markupEligibilityKey = isAddressEligible
      ? 'contactFormEligible'
      : 'contactFormIneligible';
    matomoEvent(markupData[markupEligibilityKey].matomoEvent, [storedAddress]);
    facebookEvent(markupData[markupEligibilityKey].facebookEvent);

    await submit({
      ...values,
      address: storedAddress,
      estEligible: isAddressEligible,
    }).then(() => setMessageSent(true));
  };

  useEffect(() => {
    setAddressCoords(storedAddress);
  }, [storedAddress]);

  return (
    <>
      <Head>
        <title>Demande de contact : France Chaleur Urbaine</title>
      </Head>
      <MainLayout>
        <Slice>
          <div className="fr-col-12">
            {messageSent ? (
              <>
                <CallOut>
                  <CallOutTitle>
                    Votre demande de contact est bien prise en compte.
                  </CallOutTitle>
                  <CallOutBody>
                    L'équipe France Chaleur Urbaine a bien reçu votre demande et
                    reviendra vers vous dans les meilleurs délais afin de vous
                    apporter une réponse. Dans l'attente, n'hésitez pas à
                    consulter notre{' '}
                    <Link href="/ressources">
                      <a>centre de ressources</a>
                    </Link>
                  </CallOutBody>
                </CallOut>
                <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
                  <UnderlinedLink
                    className="fr-md-auto"
                    href={process.env.NEXT_PUBLIC_FEEDBACK_URL}
                  >
                    <img
                      src="https://voxusagers.numerique.gouv.fr/static/bouton-bleu.svg"
                      alt="Je donne mon avis"
                      title="Je donne mon avis sur cette démarche"
                    />
                  </UnderlinedLink>
                </div>
              </>
            ) : (
              <ContactFormWrapper>
                <ContactFormContentWrapper>
                  <ContactFormDescription
                    isAddressEligible={isAddressEligible}
                  />
                </ContactFormContentWrapper>
                <ContactFormContentWrapper>
                  <CallOutWithAddress
                    isAddressEligible={isAddressEligible}
                    address={addressCoords}
                  />
                  <div className="fr-mt-5w">
                    <ContactForm
                      onSubmit={handleSubmitForm}
                      isSubmitting={submitting}
                    />
                  </div>
                </ContactFormContentWrapper>
              </ContactFormWrapper>
            )}
          </div>
        </Slice>
      </MainLayout>
    </>
  );
}
