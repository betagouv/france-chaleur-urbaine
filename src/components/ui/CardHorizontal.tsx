import Slideshow from '@components/Slideshow';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';

const CardHorizontal = ({ ville, date, description, images }: { ville: string; date: string; description: string; images: string[] }) => (
  <Box pt="6w" className="fr-container">
    <Box className="fr-grid-row fr-grid-row--gutters">
      <Box display="flex" flexDirection="column" gap="16px" className="fr-col fr-col-12 fr-col-lg-6">
        <Heading as="h3" color="blue-france" mb="0">
          {ville}
        </Heading>
        <Text size="xs" legacyColor="lightgrey">
          <span className="fr-icon--sm fr-icon-arrow-right-line fr-mr-1w" />
          {date}
        </Text>
        <Text size="lg">{description}</Text>
      </Box>
      <Box className="fr-col fr-col-12 fr-col-lg-6">
        <Slideshow images={images} />
      </Box>
    </Box>
  </Box>
);

export default CardHorizontal;
