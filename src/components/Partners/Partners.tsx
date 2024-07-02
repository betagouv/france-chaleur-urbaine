import { partenaires } from '@data/partenaires/partnerData';
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
import Icon from '@components/ui/Icon';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';

const Partners = () => {
  const [firstLogo, setFirstLogo] = useState(0);
  const logos = useMemo(() => {
    const shuffledLogos = partenaires
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
        (firstLogo + value + partenaires.length) % partenaires.length
      );
    },
    [firstLogo]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setNextLogo(1), 3000);
    return () => clearTimeout(timeout);
  }, [setNextLogo]);

  return (
    <Box py="10w" id="partenaires">
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
            <Icon name="ri-arrow-left-circle-line" size="lg" />
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
            <Icon name="ri-arrow-right-circle-line" size="lg" />
          </Arrow>
        </Box>

        <ButtonsGroup
          className="fr-mt-8w"
          inlineLayoutWhen="sm and up"
          alignment="center"
          buttons={[
            {
              children: 'Rejoindre notre réseau',
              linkProps: {
                href: '/contact',
              },
            },
            {
              children: 'Notre dossier de présentation',
              priority: 'secondary',
              linkProps: {
                href: '/documentation/dossier-presse.pdf',
                target: '_blank',
              },
            },
          ]}
        />
      </Box>
    </Box>
  );
};

export default Partners;
