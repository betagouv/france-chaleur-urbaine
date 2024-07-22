import { WhiteCheckItem } from '@components/MarkdownWrapper/MarkdownWrapper.style';

import { Container, Image, Information } from './Informations.styles';

const Informations = () => {
  return (
    <>
      <Image src="/img/logo_rf.png" alt="logo france chaleur urbaine" />
      <Container>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <div>
            <b>France Chaleur Urbaine</b> est un service gratuit du Ministère de la transition écologique qui vous permet de :
          </div>
        </Information>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <WhiteCheckItem>
            <div>
              Découvrir <b>instantanément</b> si un réseau de chaleur passe près de chez vous
            </div>
          </WhiteCheckItem>
        </Information>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <WhiteCheckItem>
            <div>
              <b>Vous informer</b> de façon complète sur ce mode de chauffage
            </div>
          </WhiteCheckItem>
        </Information>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <WhiteCheckItem>
            <div>
              Être <b>mis en relation avec l’exploitant</b> du réseau le plus proche de chez vous.
            </div>
          </WhiteCheckItem>
        </Information>
      </Container>
    </>
  );
};

export default Informations;
