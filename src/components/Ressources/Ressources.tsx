import Infographies from '@components/Coproprietaire/Infographies';
import Slice from '@components/Slice';
import ColdNetwork from './ColdNetwork';
import Growth from './Growth';
import Header from './Header';
import Issues from './Issues';
import { Banner, BannerImage, BannerTitle } from './Ressources.styles';
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
      <Slice
        padding={8}
        theme="color"
        header="## Les réseaux de froid : un enjeu pour l'avenir"
      >
        <ColdNetwork />
      </Slice>
      <Slice padding={8}>
        <Banner>
          <BannerTitle>
            <b>46 390 bâtiments</b> sont déjà raccordés à l’un des{' '}
            <b>933 réseaux de chaleur et de froid français !</b>
          </BannerTitle>
          <BannerImage alt="" src="/img/ressources-end.png" />
        </Banner>
      </Slice>
    </>
  );
};

export default Ressources;
