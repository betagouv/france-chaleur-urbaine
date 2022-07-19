import Slice from '@components/Slice';
import { partnerData } from '@data/partenaires';
import { ButtonGroup, Icon } from '@dataesr/react-dsfr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Arrow,
  PartnerImage,
  PartnerImages,
  PartnerLink,
  Wrapper,
} from './Partners.style';

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
    <Slice
      padding={10}
      className="--slice-schema-container"
      header={`
## Notre réseau de partenaires

Plusieurs acteurs soutiennent France Chaleur Urbaine : ils contribuent au développement du service, apportent des données, utilisent le service ou s’en font le relais.
`}
    >
      <Wrapper>
        <Arrow onClick={() => setNextLogo(-1)}>
          <Icon name="ri-arrow-left-circle-line" size="xl" />
        </Arrow>
        <PartnerImages>
          {logos.map(({ key, image, title, link }, index) => (
            <PartnerLink
              display={index >= firstLogo}
              href={link}
              target="_blank"
              rel="noreferrer noopener"
              key={key}
            >
              <PartnerImage src={image} alt={title} />
            </PartnerLink>
          ))}
        </PartnerImages>
        <Arrow onClick={() => setNextLogo(1)}>
          <Icon name="ri-arrow-right-circle-line" size="xl" />
        </Arrow>
      </Wrapper>
      <ButtonGroup isInlineFrom="xs" align="center">
        <a
          className="fr-btn hide-link-icon"
          href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
          target="_blank"
          rel="noopener noreferrer"
        >
          Rejoindre notre réseau
        </a>
        <a
          className="fr-btn fr-btn--secondary hide-link-icon"
          href="/documentation/FCU_dossier_presentation.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Notre dossier de présentation
        </a>
      </ButtonGroup>
    </Slice>
  );
};

export default Partners;
