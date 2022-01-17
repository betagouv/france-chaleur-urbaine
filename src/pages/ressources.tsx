import ResourceCard from '@components/resources/resourceCard';
import { TextCard } from '@components/resources/resourceCard.style';
import Data from '@components/resources/resourcesData.json';
import ResourceSection from '@components/resources/resourceSection';
import MainLayout from '@components/shared/layout/MainLayout';
import Head from 'next/head';
import React from 'react';

function Resources() {
  return (
    <>
      <Head>
        <title>Ressources : France Chaleur Urbaine</title>
      </Head>
      <MainLayout currentMenu="/ressources">
        <div className="fr-container fr-mt-2w">
          <div className="fr-grid-row">
            <div className="fr-col-lg-4 fr-col-sm-12">
              <h1>{Data.title}</h1>
            </div>
          </div>
        </div>
        {Data.resources.map((resource, index) => (
          <ResourceSection key={index} title={resource.title}>
            {resource.items.map((item, index) => (
              <ResourceCard
                key={index}
                image={item.image}
                title={item.title}
                description={item.description}
                fileLink={item.fileLink}
              />
            ))}
          </ResourceSection>
        ))}
        <div className="fr-container fr-my-8w">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12">
              <h3>Cartographie et données</h3>
            </div>
            <div className="fr-col-lg-4 fr-col-sm-6">
              <div className="fr-card fr-enlarge-link">
                <TextCard className="fr-card__body">
                  <p className="fr-card__detail">Site internet</p>
                  <h4 className="fr-card__title">
                    <a
                      href="https://carto.viaseva.org/public/viaseva/map/"
                      target="_blank"
                      className="fr-card__link"
                      rel="noopener noreferrer"
                    >
                      Portail des réseaux de chaleur et de froid
                    </a>
                  </h4>
                  <p className="fr-card__desc">
                    Site ViaSeva pour visualiser les tracés des réseaux français
                    et leurs caractéristiques principales
                  </p>
                </TextCard>
                <div className="fr-card__img">
                  <img
                    src="./cart-france.png"
                    className="fr-responsive-img"
                    alt="carte"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
export default Resources;
