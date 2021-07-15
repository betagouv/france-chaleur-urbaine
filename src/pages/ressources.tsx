import ResourceCard from '@components/resources/resourceCard';
import Data from '@components/resources/resourcesData.json';
import ResourceSection from '@components/resources/resourceSection';
import MainLayout from '@components/shared/layout/MainLayout';
import React from 'react';

function Resources() {
  return (
    <MainLayout>
      <div className="fr-container fr-mt-2w">
        <div className="fr-grid-row">
          <div className="fr-col-lg-4 fr-col-sm-12">
            <h2>{Data.title}</h2>
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
    </MainLayout>
  );
}
export default Resources;
