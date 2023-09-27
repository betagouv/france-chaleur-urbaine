import { useEffect, useState } from 'react';
import { ClassedNetworksColumn } from './ClassedNetworks.styles';
import MarkdownWrapper from '@components/MarkdownWrapper';

const ClassedNetworks = ({
  city,
  nameNetwork,
  allClassed,
  isUniqueNetwork,
}: {
  city: string;
  nameNetwork: string;
  allClassed?: boolean;
  isUniqueNetwork?: boolean;
}) => {
  const [networkText, setNetworkText] = useState<string>();
  const [concernedText1, setConcernedText1] = useState<string>();
  const [concernedText2, setConcernedText2] = useState<string>();

  useEffect(() => {
    if (isUniqueNetwork) {
      setNetworkText(
        `Le réseau de ${nameNetwork} est « classé », ce qui signifie que **certains bâtiments ont l'obligation de se raccorder**.`
      );
    } else if (allClassed) {
      setNetworkText(
        `Les réseaux de ${nameNetwork} sont « classés », ce qui signifie que **certains bâtiments ont l'obligation de se raccorder**.`
      );
    } else {
      setNetworkText(
        `Certains réseaux de ${nameNetwork} sont « classés », ce qui signifie que **certains bâtiments ont l'obligation de se raccorder**.`
      );
    }
    if (
      city == 'paris' ||
      city == 'grenoble' ||
      city == 'lyon' ||
      city == 'bordeaux' ||
      city == 'metz'
    ) {
      let kw = `100`;
      if (city == 'metz') kw = '30';
      setConcernedText1(
        `Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à ${kw}kW`
      );
      setConcernedText2(
        `Tout bâtiment renouvelant son installation de chauffage au-dessus de ${kw}kW`
      );
    } else {
      setConcernedText1(
        `Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à une certaine puissance, définie par la collectivité`
      );
      setConcernedText2(
        `Tout bâtiment renouvelant son installation de chauffage au-dessus d’une certaine puissance,  définie par la collectivité`
      );
    }
  }, [allClassed, city, nameNetwork, isUniqueNetwork]);

  return (
    <>
      <ClassedNetworksColumn className="fr-col-md-6 fr-col-12">
        <MarkdownWrapper
          withPadding
          value={`
  :::puce-icon{icon="/icons/picto-warning.svg"}
  ${networkText}

  Cette obligation s’applique dans une certaine zone autour du réseau, qualifiée de **périmètre de développement prioritaire.**

  :button-link[Voir le périmètre de développement prioritaire]{href="/carte" className="fr-btn--sm fr-mt-2w"}
          `}
        />
      </ClassedNetworksColumn>
      <ClassedNetworksColumn className="fr-col-md-6 fr-col-12">
        <MarkdownWrapper
          withPadding
          value={`
  **Sont concernés :**
  ::arrow-item[${concernedText1}]
  ::arrow-item[${concernedText2}]
          `}
        />
      </ClassedNetworksColumn>
    </>
  );
};

export default ClassedNetworks;
