import { partnerData } from '@data/partenaires';
import { ButtonGroup, Icon } from '@dataesr/react-dsfr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Arrow,
  PartnerImage,
  PartnerImages,
  PartnerLink,
} from './Partners.style';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import Link from '@components/ui/Link';

const Partners = () => {
  const [firstLogo, setFirstLogo] = useState(0);
  const logos = useMemo(() => {
    const shuffledLogos = partnerData
      .map(({ image, title, link }) => ({
        key: title,
        image,
        title,
        link,
        sort: Math.random(),
      }))
      .sort((a, b) => a.sort - b.sort);

    return shuffledLogos.concat(
      shuffledLogos.map((logo) => ({ ...logo, key: `${logo.title}-2` }))
    );
  }, []);

  const setNextLogo = useCallback(
    (value: number) => {
      setFirstLogo(
        (firstLogo + value + partnerData.length) % partnerData.length
      );
    },
    [firstLogo]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setNextLogo(1), 3000);
    return () => clearTimeout(timeout);
  }, [setNextLogo]);

  return (
    <Box p="10w" id="partenaires">
      <Box className="fr-container">
        <Heading as="h2" center>
          Notre réseau de partenaires
        </Heading>
        <Text textAlign="center" maxWidth="80w" className="fr-m-md-auto">
          Plusieurs acteurs soutiennent France Chaleur Urbaine : ils contribuent
          au développement du service, apportent des données, utilisent le
          service ou s’en font le relais.
        </Text>

        <Box display="flex" alignItems="center" gap="16px" mt="8w">
          <Arrow onClick={() => setNextLogo(-1)}>
            <Icon name="ri-arrow-left-circle-line" size="xl" />
          </Arrow>
          <PartnerImages>
            {logos.map(({ key, image, title, link }, index) => (
              <PartnerLink
                show={index >= firstLogo}
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                key={key}
              >
                <PartnerImage src={image} alt={title} loading="lazy" />
              </PartnerLink>
            ))}
          </PartnerImages>
          <Arrow onClick={() => setNextLogo(1)}>
            <Icon name="ri-arrow-right-circle-line" size="xl" />
          </Arrow>
        </Box>

        <ButtonGroup isInlineFrom="xs" align="center" className="fr-mt-8w">
          <Link className="fr-btn" href="/contact">
            Rejoindre notre réseau
          </Link>
          <Link
            className="fr-btn fr-btn--secondary"
            href="/documentation/dossier-presse.pdf"
            isExternal
            eventKey="Téléchargement|Dossier Presse|Partenaires"
          >
            Notre dossier de présentation
          </Link>
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default Partners;
