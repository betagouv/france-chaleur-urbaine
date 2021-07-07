import ContactForm from '@components/contactForm/contactForm';
import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import MainLayout from '@components/shared/layout/MainLayout';
import { useRouter } from 'next/router';
import React from 'react';

export default function DemandeDeContact() {
  const { query } = useRouter();
  const isAddressEligible = query.isEligible === 'true';
  return (
    <MainLayout>
      <div className="fr-col-12">
        <CallOut>
          {isAddressEligible ? (
            <>
              <CallOutTitle>
                Votre copropriété est éligible à la chaleur urbaine.
              </CallOutTitle>
              <CallOutBody>
                Un réseau de chaleur urbaine passe à moins de 300 métres de
                votre adresse
              </CallOutBody>
            </>
          ) : (
            <CallOutTitle>
              Votre copropriété n'est éligible à la chaleur urbaine.
            </CallOutTitle>
          )}
        </CallOut>
        <ContactForm />
      </div>
    </MainLayout>
  );
}
