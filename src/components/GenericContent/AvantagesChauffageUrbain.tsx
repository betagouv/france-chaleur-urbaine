import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import Image from 'next/image';

const AvantagesChauffageUrbain = ({ title }: { title?: string }) => {
  return (
    <Box className="fr-container">
      <Heading as="h2" center>
        {title ? title : 'Les avantages du chauffage urbain'}
      </Heading>
      <Box className="fr-grid-row fr-grid-row--gutters" mt="10w">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
        >
          <Image
            src="/img/copro_avantages_1.webp"
            alt=""
            width={160}
            height={125}
            priority
            className="img-object-contain"
          />
          <Text size="lg" textAlign="center" mt="2w">
            Bénéficiez de tarifs plus stables grâce à des énergies locales
          </Text>
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
        >
          <Image
            src="/img/copro_avantages_2.webp"
            alt=""
            width={160}
            height={125}
            priority
            className="img-object-contain"
          />
          <Text size="lg" textAlign="center" mt="2w">
            Profitez de subventions pour le raccordement et d’une TVA à 5,5%
          </Text>
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
        >
          <Image
            src="/img/copro_avantages_3.webp"
            alt=""
            width={160}
            height={125}
            priority
            className="img-object-contain"
          />
          <Text size="lg" textAlign="center" mt="2w">
            Diminuez vos émissions de gaz à effet de serre d’en moyenne 50%
          </Text>
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
        >
          <Image
            src="/img/copro_avantages_4.webp"
            alt=""
            width={160}
            height={125}
            priority
            className="img-object-contain"
          />
          <Text size="lg" textAlign="center" mt="2w">
            Améliorez l'étiquette DPE de votre copropriété
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default AvantagesChauffageUrbain;
