import { useQueryState } from 'nuqs';

import { type TypeLogement } from '@/components/choix-chauffage/type-logement';
import AddressAutocompleteInput from '@/components/form/dsfr/AddressAutocompleteInput';
import Radio from '@/components/form/dsfr/Radio';
import { SectionHeading, SectionTwoColumns } from '@/components/ui/Section';
import { type SuggestionItem } from '@/types/Suggestions';
import { isDefined } from '@/utils/core';

import ChoixChauffageResults from './ChoixChauffageResults';
function ChoixChauffageForm() {
  const [typeLogement, setTypeLogement] = useQueryState<TypeLogement | undefined>('type', {
    defaultValue: undefined,
  });
  const [address, setAddress] = useQueryState<string | undefined>('address', {
    defaultValue: undefined,
  });

  return (
    <SectionTwoColumns className="!mt-0">
      <div>
        <SectionHeading as="h2">Quel chauffage écologique pour mon logement&nbsp;?</SectionHeading>

        <AddressAutocompleteInput
          className="!mb-2"
          label={<strong>Entrez votre adresse :</strong>}
          onSelect={(geoAddress?: SuggestionItem) => {
            setAddress(geoAddress?.properties?.label ?? '');
          }}
        />
        <Radio
          name="radio"
          options={[
            {
              illustration: <img alt="illustration" src="/img/picto_logement_immeuble_chauffage_collectif.svg" />,
              label: 'Immeuble chauffage collectif',
              nativeInputProps: {
                value: 'immeuble_chauffage_collectif',
                checked: typeLogement === 'immeuble_chauffage_collectif',
                onChange: (e) => setTypeLogement(e.target.value as TypeLogement),
              },
            },
            {
              illustration: <img alt="illustration" src="/img/picto_logement_immeuble_chauffage_individuel.svg" />,
              label: 'Immeuble chauffage individuel',
              nativeInputProps: {
                value: 'immeuble_chauffage_individuel',
                checked: typeLogement === 'immeuble_chauffage_individuel',
                onChange: (e) => setTypeLogement(e.target.value as TypeLogement),
              },
            },
            {
              illustration: <img alt="illustration" src="/img/picto_logement_maison_individuelle.svg" />,
              label: 'Maison individuelle',
              nativeInputProps: {
                value: 'maison_individuelle',
                checked: typeLogement === 'maison_individuelle',
                onChange: (e) => setTypeLogement(e.target.value as TypeLogement),
              },
            },
          ]}
        />
      </div>
      {isDefined(typeLogement) && isDefined(address) ? (
        <ChoixChauffageResults typeLogement={typeLogement} address={address} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="italic text-center fr-py-2w fr-px-6w">
            Renseignez votre adresse et sélectionnez un type de bâtiment pour découvrir les modes de chauffage décarbonés les plus
            pertinents
          </div>
          <img src="/img/picto_chauffage_ecologique.svg" alt="" />
        </div>
      )}
    </SectionTwoColumns>
  );
}

export default ChoixChauffageForm;
