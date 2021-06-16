import Address from '@components/address/address';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from '@components/address/useAutocompleteBan';
import Layout from '@components/layout/layout';
import { useState } from 'react';
const AlertAdresse: React.FC = () => {
  return (
    <div className="fr-callout fr-fi-information-line">
      <h4 className="fr-callout__title">
        Cette adresse est éligible à un réseau de chaleur urbaine
      </h4>
    </div>
  );
};
export default function Home() {
  const [displayEligibilityState, setDisplayEligibilityState] = useState(false);

  const handleEligibilityChecked = () => {
    setDisplayEligibilityState(true);
  };
  return (
    <Layout>
      <div className="fr-col-12 fr-col-md-8">
        <h1>
          Découvrez s'il existe un réseau de chaleur proche de votre copropriété
        </h1>
        {displayEligibilityState && <AlertAdresse />}
        <ServicesContext.Provider
          value={{
            suggestionService: new SuggestionService(fetch),
            heatNetworkService: new HeatNetworkService(fetch),
          }}
        >
          <Address onEligibilityChecked={handleEligibilityChecked} />
        </ServicesContext.Provider>
      </div>
    </Layout>
  );
}
