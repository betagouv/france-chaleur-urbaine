import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { useCallback, useEffect, useState } from 'react';

import Box from '@/components/ui/Box';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Section, { type SectionProps, SectionSubtitle, SectionTitle } from '@/components/ui/Section';
import { partenaires } from '@/data/partenaires/partnerData';
import { shuffleArray } from '@/utils/array';
import cx from '@/utils/cx';

import { Arrow, PartnerImage, PartnerImages } from './Partners.style';

const Partners: React.FC<SectionProps> = (props) => {
  const [firstLogo, setFirstLogo] = useState(0);
  const [logos, setLogos] = useState(partenaires);

  useEffect(() => {
    setLogos(shuffleArray(partenaires));
  }, []);

  const setNextLogo = useCallback(
    (value: number) => {
      setFirstLogo((firstLogo + value + partenaires.length) % partenaires.length);
    },
    [firstLogo]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setNextLogo(1), 3000);
    return () => clearTimeout(timeout);
  }, [setNextLogo]);

  return (
    <Section id="partenaires" {...props}>
      <SectionTitle>Notre réseau de partenaires</SectionTitle>
      <SectionSubtitle>
        Plusieurs acteurs soutiennent France Chaleur Urbaine : ils contribuent au développement du service, apportent des données, utilisent
        le service ou s’en font le relais.
      </SectionSubtitle>

      <Box display="flex" alignItems="center" gap="16px" mt="8w">
        <Arrow onClick={() => setNextLogo(-1)}>
          <Icon name="ri-arrow-left-circle-line" size="lg" />
        </Arrow>
        <PartnerImages>
          {logos.map(({ image, title, link }, index) => (
            <Link
              isExternal
              className={cx(index >= firstLogo && 'hidden')}
              href={link}
              key={`link-${title}`}
              postHogEventKey="home:partner_logo_clicked"
              postHogEventProps={{ partner_name: title, target_url: link }}
            >
              <PartnerImage src={image} alt={title} loading="lazy" className="max-w-none" />
            </Link>
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
            linkProps: {
              href: '/documentation/dossier-presse.pdf',
              target: '_blank',
            },
            priority: 'secondary',
          },
        ]}
      />
    </Section>
  );
};

export default Partners;
