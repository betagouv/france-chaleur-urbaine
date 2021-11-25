import Textarea from '@components/shared/textarea';
import { Field } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';

export const defaultValuesContactTopic = {
  besoin: '',
};
export const validationSchemasContactTopic = {
  besoin: Yup.string(),
};

const elligiblePlaceholder = `Par exemple : 
- en savoir plus sur les réseaux de chaleur ou ce qu'implique un raccordement (étapes, travaux,...), 
- obtenir des information sur le réseau qui passe près de chez moi, 
- être mis en relation avec la collectivité / l'exploitant de ce réseau, 
- échanger avec des copropriétés déjà raccordées,
etc.`;

const unelligiblePlaceholder = `Par exemple : 
- en apprendre plus sur les réseaux de chaleur, 
- connaître les projets en cours dans mon quartier, 
- decouvrir d'autres solutions de chauffage écologiques, 
- en savoir plus sur France Chaleur Urbaine,
etc.`;

const getNbLine = (str = '') => (str?.match(/[\r\n]/g)?.length ?? 0) + 1 ?? 0;

const ContactTopic = () => {
  const { query } = useRouter();
  const isAddressEligible = query.isEligible === 'true';
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Quelles sont vos attentes ?
      </legend>

      <div className="fr-my-3w">
        <Field
          name="besoin"
          component={Textarea}
          field={{
            rows: Math.max(
              getNbLine(elligiblePlaceholder),
              getNbLine(unelligiblePlaceholder)
            ),
          }}
          placeholder={
            isAddressEligible ? elligiblePlaceholder : unelligiblePlaceholder
          }
        />
      </div>
    </fieldset>
  );
};

export default ContactTopic;
