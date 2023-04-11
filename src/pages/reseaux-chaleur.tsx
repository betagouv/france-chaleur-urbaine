import HeatNetwork from '@components/Ressources/Contents/HeatNetwork';
import Header from '@components/Ressources/Header';
import { StickyWrapper } from '@components/Ressources/Ressource.styles';
import {
  Description,
  Title,
} from '@components/Ressources/RessourceContent.styles';
import StickyForm from '@components/Ressources/StickyForm';
import Slice from '@components/Slice';
import { useRef } from 'react';

const ChauffageUrbain = () => {
  const reseauDeChaleurRef = useRef<null | HTMLHeadingElement>(null);
  const energiesRef = useRef<null | HTMLHeadingElement>(null);
  const developpementRef = useRef<null | HTMLHeadingElement>(null);
  const caracteristiquesRef = useRef<null | HTMLHeadingElement>(null);
  const loiRef = useRef<null | HTMLHeadingElement>(null);
  const avantagesRef = useRef<null | HTMLHeadingElement>(null);
  const acteursRef = useRef<null | HTMLHeadingElement>(null);
  const raccordablesRef = useRef<null | HTMLHeadingElement>(null);
  const obligationsRef = useRef<null | HTMLHeadingElement>(null);
  const accompagnementRef = useRef<null | HTMLHeadingElement>(null);
  const chaleurRef = useRef<null | HTMLHeadingElement>(null);
  const aidesRef = useRef<null | HTMLHeadingElement>(null);
  const subventionRef = useRef<null | HTMLHeadingElement>(null);
  return (
    <>
      <Header
        title="Découvrez les réseaux de chaleur"
        description="Changez pour un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français !"
      />
      <div id="contenu" />
      <StickyForm />
      <StickyWrapper>
        <Slice>
          <Title>Tout savoir sur les réseaux de chaleur</Title>
          <Description>
            <b>
              Les réseaux de chaleur sont une solution de plus en plus prisée
              pour répondre aux besoins de chauffage des bâtiments. Ils
              permettent de fournir de la chaleur à un grand nombre de bâtiments
              à partir de sources d’énergies renouvelables ou de récupération
              locales. Vous êtes nombreux à vous poser des questions sur le
              fonctionnement et l’intérêt de ces réseaux de chaleur. Nous vous
              apportons nos réponses dans cet article.
            </b>
            <br />
            <br />
            <ul>
              <li
                onClick={() =>
                  reseauDeChaleurRef.current &&
                  reseauDeChaleurRef.current.scrollIntoView()
                }
              >
                <u>Qu’est-ce qu’un réseau de chaleur ?</u>
              </li>
              <li
                onClick={() =>
                  energiesRef.current && energiesRef.current.scrollIntoView()
                }
              >
                <u>Quelles énergies alimentent les réseaux de chaleur ?</u>
              </li>
              <li
                onClick={() =>
                  developpementRef.current &&
                  developpementRef.current.scrollIntoView()
                }
              >
                <u>
                  Quand et comment les réseaux de chaleur se sont-ils développés
                  en France ?
                </u>
              </li>
              <li
                onClick={() =>
                  caracteristiquesRef.current &&
                  caracteristiquesRef.current.scrollIntoView()
                }
              >
                <u>
                  Quelles sont aujourd’hui les caractéristiques des réseaux de
                  chaleur français ?
                </u>
              </li>
              <li
                onClick={() =>
                  loiRef.current && loiRef.current.scrollIntoView()
                }
              >
                <u>
                  Quels objectifs la loi fixe-t-elle pour le développement des
                  réseaux de chaleur ?
                </u>
              </li>
              <li
                onClick={() =>
                  avantagesRef.current && avantagesRef.current.scrollIntoView()
                }
              >
                <u>Quels sont les avantages des réseaux de chaleur ?</u>
              </li>
              <li
                onClick={() =>
                  acteursRef.current && acteursRef.current.scrollIntoView()
                }
              >
                <u>Quels sont les acteurs en charge des réseaux de chaleur ?</u>
              </li>
              <li
                onClick={() =>
                  raccordablesRef.current &&
                  raccordablesRef.current.scrollIntoView()
                }
              >
                <u>
                  Tous les bâtiments sont-ils raccordables à un réseau de
                  chaleur ?
                </u>
              </li>
              <li
                onClick={() =>
                  obligationsRef.current &&
                  obligationsRef.current.scrollIntoView()
                }
              >
                <u>
                  Certains bâtiments ont-ils l’obligation de se raccorder à un
                  réseau de chaleur ?
                </u>
              </li>
              <li
                onClick={() =>
                  accompagnementRef.current &&
                  accompagnementRef.current.scrollIntoView()
                }
              >
                <u>
                  À qui m’adresser pour être accompagné dans mon projet de
                  raccordement ?
                </u>
              </li>
              <li
                onClick={() =>
                  chaleurRef.current && chaleurRef.current.scrollIntoView()
                }
              >
                <u>
                  Comment la chaleur fournie par un réseau est-elle facturée à
                  l’abonné ?
                </u>
              </li>
              <li
                onClick={() =>
                  aidesRef.current && aidesRef.current.scrollIntoView()
                }
              >
                <u>
                  Quelles sont les aides financières mobilisables pour le
                  raccordement d’un bâtiment à un réseau de chaleur ?
                </u>
              </li>
              <li
                onClick={() =>
                  subventionRef.current &&
                  subventionRef.current.scrollIntoView()
                }
              >
                <u>
                  Quelles sont les subventions mobilisables pour la création
                  d’un réseau de chaleur, son extension ou son verdissement ?
                </u>
              </li>
            </ul>
          </Description>
          <HeatNetwork
            reseauDeChaleurRef={reseauDeChaleurRef}
            energiesRef={energiesRef}
            developpementRef={developpementRef}
            caracteristiquesRef={caracteristiquesRef}
            loiRef={loiRef}
            avantagesRef={avantagesRef}
            acteursRef={acteursRef}
            raccordablesRef={raccordablesRef}
            obligationsRef={obligationsRef}
            accompagnementRef={accompagnementRef}
            chaleurRef={chaleurRef}
            aidesRef={aidesRef}
            subventionRef={subventionRef}
          />
        </Slice>
      </StickyWrapper>
    </>
  );
};

export default ChauffageUrbain;
