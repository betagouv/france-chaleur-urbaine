import type React from 'react';
import { useEffect, useState } from 'react';

import { ArrowItem, PuceIcon } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import Link from '@/components/ui/Link';

import { ClassedNetworksColumn } from './ClassedNetworks.styles';

const ClassedNetworks = ({
  city,
  nameNetwork,
  allClassed,
  isUniqueNetwork,
  hasDevelopmentPerimeter,
}: {
  city: string;
  nameNetwork: string;
  allClassed?: boolean;
  isUniqueNetwork?: boolean;
  hasDevelopmentPerimeter?: boolean;
}) => {
  const [networkText, setNetworkText] = useState<React.ReactNode>();
  const [concernedText1, setConcernedText1] = useState<string>();
  const [concernedText2, setConcernedText2] = useState<string>();

  useEffect(() => {
    setNetworkText(
      <PuceIcon icon="/icons/picto-warning.svg">
        <p>
          {isUniqueNetwork ? (
            <>Le réseau de {nameNetwork} est « classé », </>
          ) : allClassed ? (
            <>Les réseaux de {nameNetwork} sont « classés », </>
          ) : (
            <>Certains réseaux de {nameNetwork} sont « classés », </>
          )}
          ce qui signifie que <strong>certains bâtiments ont l'obligation de se raccorder</strong>.
        </p>
        <p>
          Cette obligation s’applique dans une certaine zone autour du réseau, qualifiée de{' '}
          <strong>périmètre de développement prioritaire.</strong>
        </p>
        {hasDevelopmentPerimeter && (
          <Link variant="primary" href="/carte" className="fr-mt-2w fr-btn--sm">
            Voir le périmètre de développement prioritaire
          </Link>
        )}
      </PuceIcon>
    );

    if (city === 'paris' || city === 'grenoble' || city === 'lyon' || city === 'bordeaux' || city === 'metz') {
      const kw = city === 'metz' ? '30' : '100';
      setConcernedText1(`Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à ${kw}kW`);
      setConcernedText2(`Tout bâtiment renouvelant son installation de chauffage au-dessus de ${kw}kW`);
    } else {
      setConcernedText1(
        `Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à une certaine puissance, définie par la collectivité`
      );
      setConcernedText2(
        `Tout bâtiment renouvelant son installation de chauffage au-dessus d’une certaine puissance, définie par la collectivité`
      );
    }
  }, [allClassed, city, nameNetwork, isUniqueNetwork, hasDevelopmentPerimeter]);

  return (
    <>
      <ClassedNetworksColumn className="fr-col-md-6 fr-col-12 fr-px-md-6w">{networkText}</ClassedNetworksColumn>
      <ClassedNetworksColumn className="fr-col-md-6 fr-col-12 fr-px-md-6w">
        <strong className="d-block fr-mb-3w">Sont concernés :</strong>
        <ArrowItem>{concernedText1}</ArrowItem>
        <ArrowItem>{concernedText2}</ArrowItem>
      </ClassedNetworksColumn>
    </>
  );
};

export default ClassedNetworks;
