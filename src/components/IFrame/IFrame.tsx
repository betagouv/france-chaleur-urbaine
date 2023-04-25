import Slice from '@components/Slice';
import WrappedText from '@components/WrappedText';

const IFrame = ({ theme }: { theme?: string }) => {
  return (
    <Slice id="iframe" padding={8} theme={theme} direction="row">
      <WrappedText imgSrc="/img/iframe.png" reverse>
        <div className="slice-carto-text">
          <h3>
            Offrez aux visiteurs de votre site la possibilité de vérifier
            immédiatement s'ils sont raccordables à un réseau de chaleur.
          </h3>
          Nous mettons à votre disposition un iframe que vous pouvez librement
          reprendre pour votre site internet.{' '}
          <b>
            Le champ de recherche ci-contre sera ainsi directement intégré sur
            votre site.
          </b>
          <br />
          Pour cela, <b>il vous suffit de copier les lignes de code</b>{' '}
          ci-dessous :
          <br />
          {`
<iframe
width="900px"
height="235px"
title="France chaleur urbaine - Éligibilité"
src="https://france-chaleur-urbaine.beta.gouv.fr/form"
/>
`}
        </div>
      </WrappedText>
    </Slice>
  );
};

export default IFrame;
