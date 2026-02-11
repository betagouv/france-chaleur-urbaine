import { Container, Image, Information } from './Informations.styles';

const Informations = () => {
  return (
    <>
      <Image src="/logo-rf.svg" alt="logo République française" className="bg-white fr-p-1v" />
      <Container>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <div>
            <b>France Chaleur Urbaine</b> est un service gratuit du Ministère de la transition écologique qui vous permet de :
          </div>
        </Information>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <div className="flex items-center gap-3 fr-icon--lg fr-icon--left fr-icon-checkbox-fill">
            <div>
              Découvrir <b>instantanément</b> si un réseau de chaleur passe près de chez vous
            </div>
          </div>
        </Information>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <div className="flex items-center gap-3 fr-icon--lg fr-icon--left fr-icon-checkbox-fill">
            <div>
              <b>Vous informer</b> de façon complète sur ce mode de chauffage
            </div>
          </div>
        </Information>
        <Information className="fr-col-md-12 fr-col-lg-3">
          <div className="flex items-center gap-3 fr-icon--lg fr-icon--left fr-icon-checkbox-fill">
            <div>
              Être <b>mis en relation avec l’exploitant</b> du réseau le plus proche de chez vous.
            </div>
          </div>
        </Information>
      </Container>
    </>
  );
};

export default Informations;
