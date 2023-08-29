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
          <br />
          {`
<iframe
width="100%"
title="France chaleur urbaine - Éligibilité"
src="https://france-chaleur-urbaine.beta.gouv.fr/form"
/>
`}
          <br />
          <br />
          Pensez à ajuster les valeurs des variables "width" et "height" pour
          obtenir un affichage optimal sur votre site.
        </div>
      </WrappedText>
    </Slice>
  );
};

export default IFrame;
