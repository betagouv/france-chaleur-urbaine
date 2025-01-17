import SimplePage from '@/components/shared/page/SimplePage';
import Statistics from '@/components/Statistics/Statistics';

function Statistiques() {
  return (
    <SimplePage
      title="Statistiques de France Chaleur Urbaine"
      description="Découvrez l'impact de France Chaleur Urbaine, un service du ministère de la Transition écologique (demandes de raccordement, tests d'adresse, visites…)."
    >
      <Statistics />
    </SimplePage>
  );
}

export default Statistiques;
