import { useRef } from 'react';

import Heating from '@/components/Ressources/Contents/DistrictHeating';
import Header from '@/components/Ressources/Header';
import { StickyWrapper } from '@/components/Ressources/Ressource.styles';
import { Description, Title } from '@/components/Ressources/RessourceContent.styles';
import SimplePage from '@/components/shared/page/SimplePage';
import Slice from '@/components/Slice';
import StickyForm from '@/components/StickyForm/StickyForm';

const ChauffageUrbain = () => {
  const chauffageUrbainRef = useRef<null | HTMLHeadingElement>(null);
  const avantagesRef = useRef<null | HTMLHeadingElement>(null);
  const chargeRef = useRef<null | HTMLHeadingElement>(null);
  const critereRef = useRef<null | HTMLHeadingElement>(null);
  const obligationRef = useRef<null | HTMLHeadingElement>(null);
  const accompagnementRef = useRef<null | HTMLHeadingElement>(null);
  const aidesRef = useRef<null | HTMLHeadingElement>(null);
  return (
    <SimplePage
      currentPage="/"
      title="Découvrez le chauffage urbain"
      description="Remplacez votre chaudière gaz ou fioul par un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français !"
    >
      <Header
        title="Découvrez le chauffage urbain"
        titleAs={'h2'}
        description="Changez pour un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français !"
      />
      <div id="contenu" />
      <StickyForm />
      <StickyWrapper>
        <Slice>
          <Title>Tout savoir sur le chauffage urbain</Title>
          <Description>
            <ul>
              <li onClick={() => chauffageUrbainRef.current && chauffageUrbainRef.current.scrollIntoView()}>
                <u>Qu’est-ce que le chauffage urbain ?</u>
              </li>
              <li onClick={() => avantagesRef.current && avantagesRef.current.scrollIntoView()}>
                <u>Quels sont les avantages du chauffage urbain ?</u>
              </li>
              <li onClick={() => chargeRef.current && chargeRef.current.scrollIntoView()}>
                <u>Qui est en charge du chauffage urbain ?</u>
              </li>
              <li onClick={() => critereRef.current && critereRef.current.scrollIntoView()}>
                <u>Quels critères faut-il satisfaire pour être raccordable ?</u>
              </li>
              <li onClick={() => obligationRef.current && obligationRef.current.scrollIntoView()}>
                <u>Existe-t-il des obligations de raccordement au chauffage urbain ?</u>
              </li>
              <li onClick={() => accompagnementRef.current && accompagnementRef.current.scrollIntoView()}>
                <u>Comment être accompagné dans mon projet de raccordement ?</u>
              </li>
              <li onClick={() => aidesRef.current && aidesRef.current.scrollIntoView()}>
                <u>Quelles sont les aides financières disponibles ?</u>
              </li>
            </ul>
          </Description>
          <Heating
            chauffageUrbainRef={chauffageUrbainRef}
            avantagesRef={avantagesRef}
            chargeRef={chargeRef}
            critereRef={critereRef}
            obligationRef={obligationRef}
            accompagnementRef={accompagnementRef}
            aidesRef={aidesRef}
          />
        </Slice>
      </StickyWrapper>
    </SimplePage>
  );
};

export default ChauffageUrbain;
