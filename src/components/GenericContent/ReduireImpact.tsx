import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';

const ReduireImpact = () => {
  return (
    <Box className="fr-container">
      <Heading as="h5" legacyColor="white">
        Réduire l'impact écologique et économique de son chauffage
      </Heading>
      <Text mt="3w">Le chauffage urbain, une solution pour les copropriétés</Text>
      <Text mt="3w">
        Le chauffage représente 67 % de la consommation d’énergie des foyers français et près de 20 % des émissions de gaz à effet de serre
        nationales. L’augmentation des prix de l’énergie pèse sur le budget des ménages : 40 % des logements sont encore chauffés au gaz,
        dont les prix ont augmenté de 41 % en 10 ans.
      </Text>
      <Text mt="3w">
        Pour réduire l’impact écologique d’une copropriété et ses factures d’énergie, la rénovation thermique est le premier réflexe à
        avoir. Le <Link href="/ressources/avantages#contenu">remplacement d’un chauffage collectif au gaz ou fioul</Link>, par un
        raccordement à un réseau de chaleur permet également d’y contribuer. Alimentés majoritairement par des énergies renouvelables et de
        récupération locales, les réseaux de chaleur émettent deux fois moins de gaz à effet de serre qu’un chauffage gaz ou fioul et
        offrent des prix stables et compétitifs.
      </Text>
      <Text mt="6w">
        Des réseaux de chaleur existent dans la plupart des grandes villes, par exemple <Link href="/villes/paris">Paris</Link>,{' '}
        <Link href="/villes/rennes">Rennes</Link>, <Link href="/villes/nantes">Nantes</Link>, <Link href="/villes/bordeaux">Bordeaux</Link>,{' '}
        <Link href="/villes/strasbourg">Strasbourg</Link>, <Link href="/villes/metz">Metz</Link>,{' '}
        <Link href="/villes/grenoble">Grenoble</Link>, <Link href="/villes/lyon">Lyon</Link>,{' '}
        <Link href="/villes/aix-en-provence">Aix-en-Provence</Link>,...
      </Text>
    </Box>
  );
};

export default ReduireImpact;
