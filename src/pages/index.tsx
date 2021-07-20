import Adventage from '@components/adventage/adventage';
import HowIsItWorking from '@components/howIsItWorking/howIsItWorking';
import MainLayout from '@components/shared/layout/MainLayout';
import Testimony from '@components/testimony/testimony';
import React from 'react';

export default function Home() {
  return (
    <>
      <MainLayout banner={true}>
        <div className="fr-container fr-mt-2w">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-11">
              <HowIsItWorking />
              <Adventage />
              <Testimony />
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
