import WrappedText from '@components/WrappedText';
import {
  Banner,
  BannerDescription,
  BannerImage,
  BannerTitle,
  Questions,
} from './Footer.styles';
import { Block, BlockTitle } from './Understanding.styles';

const Footer = () => {
  return (
    <WrappedText title="Une filière en pleine croissance">
      <Questions>
        <Block>
          <BlockTitle>Quels sont les acteurs impliqués ?</BlockTitle>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Block>
        <Block>
          <BlockTitle>Quels sont les acteurs impliqués ?</BlockTitle>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Block>
      </Questions>
      <Banner>
        <BannerTitle>
          <b>43 945 bâtiments</b> sont déjà raccordés à l’un des{' '}
          <b>833 réseaux de chaleur français !</b>
        </BannerTitle>
        <BannerDescription>
          Ils bénéficient d’une chaleur produite à plus de <b>60%</b> par des
          énergies renouvelables et de récupération locales.
        </BannerDescription>
        <BannerImage alt="" src="/img/ressources-end.png" />
      </Banner>
    </WrappedText>
  );
};

export default Footer;
