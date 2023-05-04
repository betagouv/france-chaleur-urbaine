import Infographies from '@components/Coproprietaire/Infographies';
import Slice from '@components/Slice';
import Growth from './Growth';
import Header from './Header';
import Issues from './Issues';
import {
  Banner,
  BannerDescription,
  BannerImage,
  BannerTitle,
} from './Ressources.styles';
import StickyForm from './StickyForm';
import Understanding from './Understanding';

const Ressources = () => {
  return (
    <>
      <Header
        title="Pour aller plus loin..."
        description="Retrouvez toute notre documentation pour approfondir votre connaissance des réseaux de chaleur."
      />
      <StickyForm />
      <Slice padding={8}>
        <Infographies />
      </Slice>
      <Slice padding={8} theme="grey">
        <Issues />
      </Slice>
      <Slice
        padding={8}
        theme="color"
        header={`
## Les réseaux de chaleur en pratique :
## tout comprendre pour se raccorder
      `}
      >
        <Understanding />
      </Slice>
      <Slice padding={8}>
        <Growth />
      </Slice>
      <Slice padding={8}>
        <Banner>
          <BannerTitle>
            <b>44 945 bâtiments</b> sont déjà raccordés à l’un des{' '}
            <b>898 réseaux de chaleur français !</b>
          </BannerTitle>
          <BannerDescription>
            Ils bénéficient d’une chaleur produite à plus de <b>62%</b> par des
            énergies renouvelables et de récupération locales.
          </BannerDescription>
          <BannerImage alt="" src="/img/ressources-end.png" />
        </Banner>
      </Slice>
    </>
  );
};

export default Ressources;
