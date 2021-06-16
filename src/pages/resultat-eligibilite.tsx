import Layout from '@components/layout/layout';
import React from 'react';
type AlertProps = {
  type: 'error' | 'success';
};

const Alert: React.FC = () => {
  return (
    <div className="fr-callout fr-fi-information-line">
      <h4 className="fr-callout__title">
        Votre copropriété est éligible à la chaleur urbaine.
      </h4>
      <p className="fr-callout__text">
        Un réseau de chaleur urbaine passe à moins de 300 métres de votre
        adresse
      </p>
    </div>
  );
};

export default function EligibilityResult() {
  return (
    <Layout>
      <div className="fr-col-12 fr-col-md-8">
        <Alert />
        <div>Form</div>
      </div>
    </Layout>
  );
}
