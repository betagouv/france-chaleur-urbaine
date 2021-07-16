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
    formId: process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID!,
  });
  const handleSubmitForm = async (values: Record<string, string | number>) => {
    await submit({ ...values, address: storedAddress }).then(() =>
      setMessageSent(true)
    );
  };
  useEffect(() => {
    setAddressCoords(storedAddress);
  }, [storedAddress]);
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
                L'équipe France Chaleur Urbaine a bien reçu votre demande et
                reviendra vers vous dans les meilleurs délais afin de vous
                apporter une réponse. Dans l'attente, n'hésitez pas à consulter
                notre{' '}
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
          <>
            <CallOutWithAddress
              isAddressEligible={isAddressEligible}
              address={addressCoords}
            />
            {isAddressEligible ? (
              <>
                <p>Vous pouvez compléter le formulaire ci-dessous pour :</p>
                <ul className="fr-mb-4w">
                  <li>obtenir des informations sur les réseaux de chaleur</li>
                  <li>
                    pouvoir échanger avec des copropriétés déjà raccordées
                  </li>
                  <li>
                    être mis en relation avec l'exploitant du réseau qui passe
                    près de chez vous
                  </li>
                  <li>toute autre information</li>
                </ul>
              </>
            ) : (
              <p className="fr-mt-4w">
                Pour connaître les projets en cours, en savoir plus sur d'autres
                solutions de chauffage performantes ou toute autre information,
                merci de compléter le formulaire ci-dessous. Nous reviendrons
                rapidement vers vous.
              </p>
            )}
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
  address: Record<string, string | number[]> | null;
}) {
  const variant = isAddressEligible ? 'success' : 'error';
  return (
    <CallOut variant={variant}>
      {isAddressEligible ? (
        <>
          <CallOutTitle>
            Votre copropriété est éligible à la chaleur urbaine.
          </CallOutTitle>
          <CallOutBody>
            <p>
              Un réseau de chaleur urbaine passe à moins de 300 métres de votre
              adresse : <br />
              {address?.label}
            </p>
            <Link
              href={`https://carto.viaseva.org/public/viaseva/map/?coord=${address?.coords}&zoom=15`}
            >
              <a
                target="_blank"
                className="fr-link fr-link--icon-right"
                rel="noreferrer"
              >
                Voir sur la carte
              </a>
            </Link>
          </CallOutBody>
        </>
      ) : (
        <>
          <CallOutTitle>
            Votre copropriété n'est pour le moment pas raccordable à un réseau
            de chaleur.
          </CallOutTitle>
          <CallOutBody>
            <p>
              Toutefois, les réseaux se développent et elle pourrait le devenir.
            </p>
            <a
              href={`https://carto.viaseva.org/public/viaseva/map/?coord=${address?.coords}&zoom=15`}
              target="_blank"
              className="fr-link fr-link--icon-right"
              rel="noreferrer"
            >
              Visualiser les réseaux à proximité
            </a>
          </CallOutBody>
        </>
      )}
    </CallOut>
  );
}
