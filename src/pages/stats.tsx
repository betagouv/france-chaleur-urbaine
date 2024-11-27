import SimplePage from '@components/shared/page/SimplePage';
import Statistics from '@components/Statistics/Statistics';

function Statistiques() {
  return (
    <SimplePage
      title="Statistiques sur les réseaux de chaleur urbain"
      description="Raccordements, tonnes de C02 potentiellement économisées, test d'adresse, etc"
    >
      <Statistics />
    </SimplePage>
  );
}

export default Statistiques;
