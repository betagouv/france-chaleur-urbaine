import SimplePage from '@components/shared/page/SimplePage';
import Statistics from '@components/Statistics/StatisticsV1';

function Statistiques() {
  return (
    <SimplePage
      noIndex
      title="Statistiques de France Chaleur Urbaine"
      description="Raccordements, tonnes de C02 potentiellement économisées, test d'adresse, etc"
    >
      <Statistics />
    </SimplePage>
  );
}

export default Statistiques;
