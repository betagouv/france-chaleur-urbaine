import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import MainLayout from '@components/shared/layout/MainLayout';
import React from 'react';

export default function Home() {
  return (
    <MainLayout>
      <div className="fr-col-12 fr-col-md-8"></div>
      <CheckEligibilityForm />
    </MainLayout>
  );
}
