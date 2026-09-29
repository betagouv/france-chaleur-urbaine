import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Section, { type SectionProps, SectionSubtitle, SectionTitle } from '@/components/ui/Section';
import { partenaires } from '@/data/partenaires/partnerData';
import { shuffleArray } from '@/utils/array';

const maxLogosDisplayed = 5;

const Partners: React.FC<SectionProps> = (props) => {
  const [firstLogoIndex, setFirstLogoIndex] = useState(0);
  const [logos, setLogos] = useState(partenaires);

  // shuffle after mount to keep SSR and client markup identical
  useEffect(() => {
    setLogos(shuffleArray(partenaires));
  }, []);

  const displayedLogos = useMemo(
    () => [
      ...logos.slice(firstLogoIndex, firstLogoIndex + maxLogosDisplayed),
      ...logos.slice(0, Math.max(maxLogosDisplayed - (logos.length - firstLogoIndex), 0)),
    ],
    [logos, firstLogoIndex]
  );

  const setNextLogo = useCallback(
    (direction: number) => setFirstLogoIndex((index) => (index + direction + logos.length) % logos.length),
    [logos.length]
  );

  // firstLogoIndex dependency restarts the timer after each move (auto or manual)
  useEffect(() => {
    const timeout = setTimeout(() => setNextLogo(1), 3000);
    return () => clearTimeout(timeout);
  }, [firstLogoIndex, setNextLogo]);

  return (
    <Section id="partenaires" {...props}>
      <SectionTitle>Notre réseau de partenaires</SectionTitle>
      <SectionSubtitle>
        Plusieurs acteurs soutiennent France Chaleur Urbaine : ils contribuent au développement du service, apportent des données, utilisent
        le service ou s’en font le relais.
      </SectionSubtitle>

      <div className="flex items-center gap-8 mt-12">
        <Button
          priority="tertiary no outline"
          iconId="ri-arrow-left-circle-line"
          size="large"
          className="shrink-0"
          title="Logo précédent"
          onClick={() => setNextLogo(-1)}
        />
        <div className="flex gap-8 overflow-hidden flex-1 justify-center">
          {displayedLogos.map(({ image, title, link }) => (
            <Link
              isExternal
              className="after:hidden"
              href={link}
              key={`link-${title}`}
              postHogEventKey="home:partner_logo_clicked"
              postHogEventProps={{ partner_name: title, target_url: link }}
            >
              <img src={image} alt={title} loading="lazy" className="max-w-none h-25 bg-white" />
            </Link>
          ))}
        </div>
        <Button
          priority="tertiary no outline"
          iconId="ri-arrow-right-circle-line"
          size="large"
          className="shrink-0"
          title="Logo suivant"
          onClick={() => setNextLogo(1)}
        />
      </div>

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
