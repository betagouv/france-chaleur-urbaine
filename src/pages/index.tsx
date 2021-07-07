import Layout from '@components/layout/layout';
import { useRouter } from 'next/dist/client/router';
import styled from 'styled-components';

const Button = styled.button``;
export default function Home() {
  const { push } = useRouter();
  return (
    <Layout>
      <div className="fr-col-12 fr-col-md-8">
        <h1>
          Découvrez s'il existe un réseau de chaleur proche de votre copropriété
        </h1>
        <form action="">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="text-input-groups1">
              Saisissez votre adresse en Ile-de-France et cliquez sur le bouton
              "Voir si je suis éligible".
              <span className="fr-hint-text">
                Exemple de format : 5 avenue Anatole 75007 Paris
              </span>
            </label>
            <div className="fr-input-wrap fr-fi-search-line">
              <input
                className="fr-input"
                type="text"
                id="text-input-groups1"
                name="text-input-groups1"
                placeholder="5 avenue Anatole 75007 Paris"
              />
            </div>
          </div>
          <Button
            className="fr-btn fr-btn--secondary"
            type="button"
            onClick={() => push('/resultat-eligibilite')}
          >
            VOIR SI JE SUIS ELIGIBLE
          </Button>
        </form>
      </div>
    </Layout>
  );
}
