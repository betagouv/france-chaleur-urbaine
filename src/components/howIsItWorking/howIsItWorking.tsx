import {
  ExplainCard,
  PageTitle,
} from '@components/howIsItWorking/howIsItworking.style';
import CustomImage from '@utils/CustomImage';
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
              <CustomImage
                src="/pictograms/pictoMap.png"
                alt="pictogramme carte"
                width="85px"
                height="75px"
              />
              <h4>
                Testez votre élégibilité au raccordement à un réseau de chaleur
              </h4>
            </ExplainCard>
          </div>
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <CustomImage
                src="/pictograms/pictoRelation.png"
                alt="pictogramme relation"
                width="85px"
                height="75px"
              />
              <h4>
                Soyez mis en relation avec une collectivité et/ou un exploitant
              </h4>
            </ExplainCard>
          </div>
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <CustomImage
                src="/pictograms/pictoCopro.png"
                alt="pictogramme copropriete"
                width="85px"
                height="75px"
              />
              <h4>Contactez d’autres copropriétés déjà raccordées </h4>
            </ExplainCard>
          </div>
          <div className="fr-col-lg-3 fr-col-sm-6">
            <ExplainCard>
              <CustomImage
                src="/pictograms/pictoResource.png"
                alt="pictogramme ressoources"
                width="85px"
                height="75px"
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
