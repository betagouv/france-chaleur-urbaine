import Slice from '@components/Slice';
import Documents from './Documents';
import Footer from './Footer';
import Header from './Header';
import Understanding from './Understanding';

const Ressources = () => {
  return (
    <>
      <Header
        title="Pour aller plus loin..."
        description="Retrouvez toute notre documentation pour approfondir votre connaissance des réseaux de chaleur."
      />
      <Slice
        padding={8}
        theme="grey"
        header="## Les enjeux de la transition énergétique avec les réseaux de chaleur"
      >
        <Documents />
      </Slice>
      <Slice padding={8} theme="color">
        <Understanding />
      </Slice>
      <Slice padding={8}>
        <Footer />
      </Slice>
    </>
  );
};

export default Ressources;
