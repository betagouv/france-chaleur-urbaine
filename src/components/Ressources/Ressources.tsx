import {
  PageBody,
  PageTitle,
} from '@components/HeadSliceForm/HeadSliceForm.style';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import Documents from './Documents';
import Footer from './Footer';
import { Header, Image } from './Ressources.styles';
import Understanding from './Understanding';

const Ressources = () => {
  return (
    <>
      <Slice
        padding={8}
        bg="./img/ressources-right.svg"
        bgPos="right center"
        bgSize="auto"
        bgColor="#CDE3F0"
      >
        <Header>
          <Image alt="" src="./img/ressources-left.svg" />
          <div>
            <PageTitle className="fr-mb-4w">Pour aller plus loin...</PageTitle>
            <PageBody>
              <MarkdownWrapper value="Retrouvez toute notre documentation pour approfondir votre connaissance des réseaux de chaleur." />
            </PageBody>
          </div>
        </Header>
      </Slice>
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
