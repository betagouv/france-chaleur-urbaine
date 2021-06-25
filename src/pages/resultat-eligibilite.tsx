import { CallOut, CallOutTitle } from '@components/shared/callOut/CallOut';
import Layout from '@components/shared/layout/layout';

export default function EligibilityResult() {
  return (
    <Layout>
      <div className="fr-col-12">
        <CallOut>
          <CallOutTitle>
            Votre copropriété est éligible à la chaleur urbaine.
          </CallOutTitle>
          <p>
            Un réseau de chaleur urbaine passe à moins de 300 métres de votre
            adresse
          </p>
        </CallOut>
        <h3>Demande de contact et d'information</h3>
      </div>
    </Layout>
  );
}
