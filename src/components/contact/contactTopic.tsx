import Checkbox from '@components/shared/checkbox';
import Textarea from '@components/shared/textarea';
import { Field } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';

export const defaultValuesContactTopic = {
  besoin: '',
  contacterUnOperateur: false,
};
export const validationSchemasContactTopic = {
  besoin: Yup.string().required('Veuillez indiquer le motif de votre demande'),
  contacterUnOperateur: Yup.boolean(),
};

const ContactTopic = () => {
  const { query } = useRouter();
  const isAddressEligible = query.isEligible === 'true';
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Votre demande
      </legend>

      <div className="fr-my-3w">
        <Field
          name="besoin"
          label="Quel est votre besoin ? (*)"
          component={Textarea}
          placeholder={
            isAddressEligible
              ? "Exemple : en savoir plus sur les réseaux de chaleur, en savoir plus sur ce qu'implique un raccordement à un réseau de chaleur (étapes, travaux,...), en savoir plus sur le réseau qui passe près de chez moi, être mis en relation avec la collectivité / l'exploitant de ce réseau, échanger avec des copropriétés déjà raccordées,..."
              : "Exemple : en savoir plus sur les réseaux de chaleur, connaître les projets en cours dans mon quartier, en savoir plus sur d'autres solutions de chauffage écologiques, en savoir plus sur France chaleur urbaine,..."
          }
        />
      </div>

      <div className="fr-my-3w">
        <Field
          name="contacterUnOperateur"
          label="Cochez cette case si vous souhaitez que nous contactions pour vous l’exploitant de réseau de votre quartier."
          component={Checkbox}
        />
      </div>
    </fieldset>
  );
};

export default ContactTopic;
