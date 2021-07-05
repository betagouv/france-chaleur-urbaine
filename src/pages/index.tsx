import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import Layout from '@components/shared/layout/Layout';
import React from 'react';

export default function Home() {
  return (
    <Layout>
      <div className="fr-col-12 fr-col-md-8"></div>
      <CheckEligibilityForm />
    </Layout>
  );
}
