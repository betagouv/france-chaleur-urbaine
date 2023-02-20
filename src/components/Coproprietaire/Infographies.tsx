import { Icon } from '@dataesr/react-dsfr';
import Image from 'next/image';
import {
  Container,
  Glass,
  ImageContainer,
  Images,
  Text,
} from './Infographies.styles';

const Infographies = () => {
  return (
    <Container>
      <Text>
        <h2> Une énergie d'avenir</h2>
        <h3>
          Un chauffage <b>écologique</b> à <b>prix compétitif</b> déjà adopté
          par 6 millions de Français
        </h3>
        <p>
          Un réseau de chaleur est un système de <b>canalisations</b> qui permet
          d’acheminer vers un ensemble de <b>bâtiments</b> de la <b>chaleur</b>{' '}
          produite <b>localement</b>, avec{' '}
          <b>des sources d’énergies renouvelables ou de récupération</b>{' '}
          (géothermie, biomasse, chaleur issue de l'incinération des
          déchets...).
        </p>
      </Text>
      <div>
        <Images>
          <ImageContainer href="/img/FCU_Infographie.jpg" target="_blank">
            <Image
              width={216}
              height={350}
              src="/img/copro_infographie_1.jpg"
              alt="Infographie 1"
            />
            <Glass>
              <Icon name="ri-search-eye-fill" size="2x" />
            </Glass>
          </ImageContainer>
          <ImageContainer href="/img/FCU_Infographie2.jpg" target="_blank">
            <Image
              width={216}
              height={350}
              src="/img/copro_infographie_2.jpg"
              alt="Infographie 2"
            />
            <Glass>
              <Icon name="ri-search-eye-fill" size="2x" />
            </Glass>
          </ImageContainer>
        </Images>
        <span>
          Découvrez tous les <b>enjeux</b> des réseaux de chaleur en{' '}
          <b>2 infographies</b>
        </span>
      </div>
    </Container>
  );
};

export default Infographies;
