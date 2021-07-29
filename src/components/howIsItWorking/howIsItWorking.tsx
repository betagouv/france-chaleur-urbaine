import {
  ExplainCard,
  PageTitle,
} from '@components/howIsItWorking/howIsItworking.style';
import React from 'react';

function HowIsItWorking() {
  return (
    <div className="fr-my-4w">
      <PageTitle>Comment ça marche ?</PageTitle>
      <div className="fr-col-lg-12 fr-col-sm-10">
        <p>
          France Chaleur Urbaine est une solution numérique qui vise à faciliter
          et accélérer le raccordement des copropriétés aux réseaux de chaleur.{' '}
        </p>
      </div>
      <div className="fr-container--fluid">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <img
                src="./pictoMap.png"
                alt="pictogram élégibilité à un réseau de chaleur"
              />
              <h4>
                Testez votre élégibilité au raccordement à un réseau de chaleur
              </h4>
            </ExplainCard>
          </div>
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <img src="./pictoRelation.png" alt="pictogram mis en relation" />
              <h4>
                Soyez mis en relation avec une collectivité et/ou un exploitant
              </h4>
            </ExplainCard>
          </div>
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <img
                src="./pictoCopro.png"
                alt="pictogram copropriétés raccordées"
              />
              <h4>Contactez d’autres copropriétés déjà raccordées </h4>
            </ExplainCard>
          </div>
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <img
                src="./pictoResource.png"
                alt="pictogram ressources sur les réseaux de chaleur"
              />
              <h4>Accédez à des ressources sur les réseaux de chaleur</h4>
            </ExplainCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowIsItWorking;
