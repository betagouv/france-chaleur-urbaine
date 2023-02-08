import Slice from '@components/Slice';
import WrappedText from '@components/WrappedText';

const IFrame = () => {
  return (
    <Slice
      id="iframe"
      padding={8}
      theme="grey"
      header={`## L’iframe France Chaleur Urbaine
            
*Offrez aux visiteurs de votre site la possibilité de vérifier immédiatement s'ils sont raccordables à un chauffage urbain*`}
      direction="row"
    >
      <WrappedText
        textClassName="slice-carto-text"
        body={`
Nous mettons à votre disposition un iframe que vous pouvez librement reprendre pour votre site internet.
*Le champ de recherche ci-contre sera ainsi directement intégré sur votre site, permettant à vos visiteurs de vérifier s’ils sont potentiellement raccordables.*

Pour cela, il vous suffit de copier les lignes de code ci-dessous :

*\\<iframe width="900px" height="235px" title="France chaleur urbaine - Éligibilité" src="https://france-chaleur-urbaine.beta.gouv.fr/form"/>*
`}
        imgSrc="/img/iframe.svg"
        reverse
      />
    </Slice>
  );
};

export default IFrame;
