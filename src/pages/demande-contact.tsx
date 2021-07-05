import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import Layout from '@components/shared/layout/Layout';
import { useRouter } from 'next/dist/client/router';
import React from 'react';

export default function EligibilityResult() {
  const { query } = useRouter();
  const isAddressEligible = query.isEligible === 'true';

  return (
    <Layout>
      <div className="fr-col-12">
        <CallOut>
          {isAddressEligible ? (
            <>
              <CallOutTitle>
                Votre copropriété est éligible à la chaleur urbaine.
              </CallOutTitle>
              <CallOutBody>
                Un réseau de chaleur urbaine passe à moins de 300 métres de
                votre adresse
              </CallOutBody>
            </>
          ) : (
            <CallOutTitle>
              Votre copropriété n'est éligible à la chaleur urbaine.
            </CallOutTitle>
          )}
        </CallOut>
        <h3>Demande de contact et d'information</h3>
      </div>
    </Layout>
  );
}
