import BulkEligibilityForm from '@components/EligibilityForm/BulkEligibilityForm';
import Slice from '@components/Slice/Slice';
import WrappedText from '@components/WrappedText/WrappedText';

const BulkEligibilitySlice = ({
  displayBulkEligibility,
}: {
  displayBulkEligibility: boolean;
}) => {
  return (
    <div id="test-liste">
      {displayBulkEligibility && (
        <Slice padding={8} theme="grey" direction="row">
          <div className="fr-col-lg-6 fr-col-md-12 fr-pr-4w">
            <WrappedText
              body={`
### Testez un grand nombre d’adresses pour identifier des bâtiments proches des réseaux de chaleur !
::count-item[*Téléchargez votre fichier (une ligne par adresse) et renseignez votre email*]{number=1}
::count-item[*Recevez par mail le résultat de votre test*]{number=2}
::count-item[*Visualisez les adresses testées sur notre cartographie*]{number=3}
::count-item[*Vous pourrez ensuite sélectionner dans la liste les adresses celles pour lesquelles vous souhaitez être* **mis en relation par France Chaleur Urbaine avec le(s) gestionnaire(s) des réseaux de chaleur.**]{number=4}
`}
            />
          </div>
          <div className="fr-col-lg-6 fr-col-md-12">
            <BulkEligibilityForm />
            <img width="100%" src="/img/carto-addresses.png" />
          </div>
        </Slice>
      )}
    </div>
  );
};

export default BulkEligibilitySlice;
