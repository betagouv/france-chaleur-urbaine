import ContactForm from '@components/contactForm/contactForm';
import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import MainLayout from '@components/shared/layout/MainLayout';
import { useFormspark } from '@formspark/use-formspark';
import { useLocalStorageState } from '@utils/useLocalStorage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

const UnderlinedLink = styled.a`
  text-decoration: none;
  color: white;
`;
export default function DemandeDeContact() {
  const { query } = useRouter();
  const [messageSent, setMessageSent] = useState(false);
  const isAddressEligible = query.isEligible === 'true';
  const [storedAddress] = useLocalStorageState('');
  const [submit, submitting] = useFormspark({
    formId: process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID!,
  });
  const handleSubmitForm = async (values: Record<string, string | number>) => {
    await submit({ ...values, address: storedAddress }).then(() =>
      setMessageSent(true)
    );
  };

  return (
    <MainLayout>
      <div className="fr-col-12">
        {messageSent ? (
          <>
            <CallOut>
              <CallOutTitle>
                Votre demande de contact est bien prise en compte.
              </CallOutTitle>
              <CallOutBody>
                Bonjour,
                <br />
                L'équipe France Chaleur Urbaine a bien reçu votre demande et
                reviendra vers vous dans les meilleurs délais afin de vous
                apporter une réponse. Dans l'attente, n'hésitez pas à consulter
                notre{' '}
                <Link href="/ressources">
                  <a>centre de ressources</a>
                </Link>
                <br /> Cordialement,
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
          <>
            <CallOutWithAddress
              isAddressEligible={isAddressEligible}
              address={storedAddress}
            />
            <div className="fr-mt-5w">
              <ContactForm
                onSubmit={handleSubmitForm}
                isSubmitting={submitting}
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function CallOutWithAddress({
  isAddressEligible,
  address,
}: {
  isAddressEligible: boolean;
  address: Record<string, string | number[]>;
}) {
  return (
    <CallOut>
      {isAddressEligible ? (
        <>
          <CallOutTitle>
            Votre copropriété est éligible à la chaleur urbaine.
          </CallOutTitle>
          <CallOutBody>
            <p>
              Un réseau de chaleur urbaine passe à moins de 300 métres de votre
              adresse : <br />
              {address.label}
            </p>
            <a
              href={`https://carto.viaseva.org/public/viaseva/map/?coord=${address.coords}&zoom=15`}
              target="_blank"
              className="fr-link fr-link--icon-right"
              rel="noreferrer"
            >
              Voir sur la carte
            </a>
          </CallOutBody>
        </>
      ) : (
        <CallOutTitle>
          Votre copropriété n'est pas éligible à la chaleur urbaine.
        </CallOutTitle>
      )}
    </CallOut>
  );
}
