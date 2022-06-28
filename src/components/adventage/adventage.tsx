import { PageTitle } from '@components/adventage/adventage.style';
import Highlight from '../highlight/highlight';

function Adventage() {
  return (
    <div className="fr-my-5w">
      <PageTitle className="fr-mb-4w">
        Les atouts des réseaux de chaleur ?{' '}
      </PageTitle>
      <p className="fr-mb-3w">
        Un réseau de chaleur est un système de distribution de chaleur produite
        de façon centralisée qui permet de desservir un grand nombre d’usagers
        (bâtiments tertiaires publics ou privés, copropriétés, logements
        sociaux,...). Un des atouts majeurs des réseaux de chaleur est de
        permettre de mobiliser les énergies renouvelables présentes sur le
        territoire, difficilement distribuables autrement.
      </p>
      <Highlight
        title="Économique"
        subTitle="Prix stables, TVA à taux réduit"
        description="Le prix de la chaleur urbaine ne fluctue pas contrairement au fioul et gaz naturel. Tous les réseaux à plus de 50% d’énergies locales bénéficient du taux de TVA réduit pour 100% de la facture."
        icon="./pictoEconomic.png"
        altIcon="icon"
      />
      <Highlight
        title="Écologique"
        subTitle="Moins de gaz à effet de serre et meilleure qualité de l’air"
        description="Les réseaux de chaleur sont alimentés majoritairement à plus de 50% par des énergies renouvelables comme la géothermis, le biomasse ou la chaleur produite par l’incinération de nos déchets."
        icon="./pictoEcology.png"
        altIcon="icon"
      />
      <Highlight
        title="Confort"
        subTitle="Fiabilité et sécurité assurés"
        description="Température constante, pas de rupture de chauffage, eau chaude disponible en permanence, suppression des chaudières et risques associés."
        icon="./pictoConfort.png"
        altIcon="icon"
      />
    </div>
  );
}

export default Adventage;
