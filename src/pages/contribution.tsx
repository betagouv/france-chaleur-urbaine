import ContributionForm from '@/components/ContributionForm/ContributionForm';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';

function Contribution() {
  return (
    <SimplePage
      title="Contribuer à notre carte des réseaux de chaleur urbains"
      description="France Chaleur Urbaine recense les tracés et données des réseaux de chaleur et de froid."
    >
      <Box py="4w" className="fr-container">
        <Heading as="h1" size="h2" color="blue-france">
          Vous souhaitez contribuer à notre carte en ajoutant des données ou en nous signalant une erreur ? C'est possible ! Complétez le
          formulaire ci-dessous :
        </Heading>

        <ContributionForm />
      </Box>
    </SimplePage>
  );
}

export default Contribution;
