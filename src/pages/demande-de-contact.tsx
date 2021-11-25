import ContactForm from '@components/contactForm/contactForm';
import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
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
            <h2>Demande de contact et d’information</h2>
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
              <>
                <div className="fr-mb-2w">
                  <CallOutWithAddress
                    isAddressEligible={isAddressEligible}
                    address={addressCoords}
                  />
                </div>

                {isAddressEligible ? (
                  <>
                    <p>
                      Avec le service public France Chaleur Urbaine, bénéficiez
                      d’un accompagnement personnalisé, gratuit et sans
                      engagement. <br />
                      Nous vous recontactons pour :
                    </p>
                    <ul className="fr-mb-4w">
                      <li>
                        Vous donnez des informations sur le réseau de chaleur
                        qui passe près de chez vous
                      </li>
                      <li>
                        Vous aidez dans les démarches à accomplir pour raccorder
                        votre copropriété et les étapes d’un raccordement
                      </li>
                      <li>
                        Vous faire échanger avec des copropriétés déjà
                        raccordées
                      </li>
                      <li>
                        Vous mettre en relation avec l'exploitant du réseau qui
                        passe près de chez vous
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p>
                      Vous souhaitez en savoir plus sur les projets de réseaux
                      dans votre quartier ou sur d’autres modes de chauffage
                      vertueux ? <br />
                      France Chaleur Urbaine vous recontacte pour :
                    </p>
                    <ul className="fr-mb-4w">
                      <li>
                        Vous faire découvrir les projets de création ou
                        extension de réseau dans votre quartier
                      </li>
                      <li>
                        Vous informer sur d’autres solutions de chauffage
                        performantes et écologiques
                      </li>
                    </ul>
                  </>
                )}

                <hr />

                <div className="fr-mt-5w">
                  <ContactForm
                    onSubmit={handleSubmitForm}
                    isSubmitting={submitting}
                  />
                </div>
              </>
            )}
          </div>
        </Slice>
      </MainLayout>
    </>
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
            Votre copropriété pourrait être raccordée à un réseau de chaleur
          </CallOutTitle>
          <CallOutBody>
            <p className={'fr-mb-2w'}>
              Un réseau de chaleur passe à proximité de votre adresse : <br />
              {address?.label}
            </p>
            <Link
              href={`https://carto.viaseva.org/public/viaseva/map/?coord=${address?.coords}&zoom=15`}
            >
              <a
                target="_blank"
                className="fr-text--sm"
                rel="noopener noreferrer"
              >
                Visualiser les réseaux à proximité
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
            <p className={'fr-my-2w'}>
              Toutefois, les réseaux se développent et elle pourrait le devenir.
            </p>
            <a
              href={`https://carto.viaseva.org/public/viaseva/map/?coord=${address?.coords}&zoom=15`}
              target="_blank"
              className="fr-text--sm"
              rel="noopener noreferrer"
            >
              Visualiser les réseaux à proximité
            </a>
          </CallOutBody>
        </>
      )}
    </CallOut>
  );
}
