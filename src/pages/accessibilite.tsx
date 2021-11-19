import MainLayout from '@components/shared/layout/MainLayout';
import Head from 'next/head';
import React from 'react';

function Accessibilite() {
  return (
    <>
      <Head>
        <title>Déclaration d’accessibilité France Chaleur Urbaine</title>
      </Head>
      <MainLayout>
        <div className="fr-container fr-mt-2w">
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h2>Déclaration d’accessibilité France Chaleur Urbaine</h2>
              <p>
                France Chaleur Urbaine s’engage à rendre ses sites internet,
                intranet, extranet et ses progiciels accessibles (et ses
                applications mobiles et mobilier urbain numérique) conformément
                à l’article 47 de la loi n°2005-102 du 11 février 2005.
              </p>
              <p>
                Cette déclaration d’accessibilité s’applique à{' '}
                <a href="https://france-chaleur-urbaine.beta.gouv.fr/">
                  france-chaleur-urbaine.beta.gouv.fr
                </a>
                .
              </p>
              <h3>État de conformité</h3>
              <p>
                France Chaleur Urbaine,{' '}
                <a href="https://france-chaleur-urbaine.beta.gouv.fr/">
                  france-chaleur-urbaine.beta.gouv.fr
                </a>{' '}
                est non conforme avec le référentiel général d’amélioration de
                l’accessibilité (RGAA), version 4 en raison d’absence d’audit
                achevé, ce qui ne permet pas aujourd’hui de lister les
                non-conformités du site.
              </p>
              <p>
                Cependant, France Chaleur Urbaine est conçu en utilisant le
                design system de l’état qui prend en compte l’accessibilité,.
                Nous mettrons à jour cette page lorsque nous aurons réalisé
                l’audit RGAA.
              </p>
              <h3>Établissement de cette déclaration d’accessibilité</h3>
              <p>Cette déclaration a été établie le 19/11/2021.</p>
              <strong>
                Technologies utilisées pour la réalisation de France Chaleur
                Urbaine,{' '}
                <a href="https://france-chaleur-urbaine.beta.gouv.fr/">
                  france-chaleur-urbaine.beta.gouv.fr
                </a>
              </strong>
              <ul className="fr-mb-4w">
                <li>HTML5</li>
                <li>CSS</li>
                <li>JavaScript</li>
                <li>Node.js</li>
                <li>NEXT.js</li>
                <li>REACT</li>
                <li>Styled Component</li>
                <li>Markdown</li>
              </ul>
              <p>
                Si vous n’arrivez pas à accéder à un contenu ou à un service,
                vous pouvez contacter le responsable de France Chaleur Urbaine,{' '}
                <a href="https://france-chaleur-urbaine.beta.gouv.fr/">
                  france-chaleur-urbaine.beta.gouv.fr
                </a>{' '}
                pour être orienté vers une alternative accessible ou obtenir le
                contenu sous une autre forme.
              </p>
              <ul className="fr-mb-4w">
                <li>
                  Envoyer un message à{' '}
                  <a
                    href="mailto:france-chaleur-urbaine@beta.gouv.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    france-chaleur-urbaine@beta.gouv.fr
                  </a>
                </li>
              </ul>
              <h3>Voies de recours</h3>
              <p>
                Si vous constatez un défaut d’accessibilité vous empêchant
                d’accéder à un contenu ou une fonctionnalité du site, que vous
                nous le signalez et que vous ne parvenez pas à obtenir une
                réponse de notre part, vous êtes en droit de faire parvenir vos
                doléances ou une demande de saisine au{' '}
                <a
                  href="https://formulaire.defenseurdesdroits.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Défenseur des droits
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export default Accessibilite;
