import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useState } from 'react';

import { type TypeLogement } from '@/components/choix-chauffage/type-logement';
import AddressAutocompleteInput from '@/components/form/dsfr/AddressAutocompleteInput';
import Radio from '@/components/form/dsfr/Radio';
import Section, { SectionContent, SectionHeading, SectionTwoColumns } from '@/components/ui/Section';
import { toastErrors } from '@/modules/notification';
import { useServices } from '@/services';
import { type AddressDetail } from '@/types/HeatNetworksResponse';
import { type SuggestionItem } from '@/types/Suggestions';
import { isDefined } from '@/utils/core';
import { runWithMinimumDelay } from '@/utils/time';

import ChoixChauffageResults from './ChoixChauffageResults';

function ChoixChauffageForm() {
  const { heatNetworkService } = useServices();
  const [typeLogement, setTypeLogement] = useQueryState(
    'type',
    parseAsStringLiteral([
      'immeuble_chauffage_collectif',
      'immeuble_chauffage_individuel',
      'maison_individuelle',
    ] as const satisfies TypeLogement[])
  );
  const [address, setAddress] = useQueryState('address');
  const [addressDetail, setAddressDetail] = useState<AddressDetail | null>(null);

  const testAddressEligibility = toastErrors(async (geoAddress: SuggestionItem) => {
    void setAddress(geoAddress?.properties?.label ?? '');
    const eligibilityStatus = await runWithMinimumDelay(() => heatNetworkService.findByCoords(geoAddress), 500);
    setAddressDetail({
      network: eligibilityStatus,
      geoAddress,
    });
  });

  return (
    <Section>
      <SectionContent className="mt-0!">
        <SectionTwoColumns className="mt-0!">
          <div className="flex-[3]!">
            <SectionHeading as="h2" id="quel-chauffage">
              Quel chauffage écologique pour mon logement&nbsp;?
            </SectionHeading>

            <AddressAutocompleteInput
              className="mb-2!"
              defaultValue={address ?? ''}
              label={<strong>Entrez votre adresse :</strong>}
              onSelect={(geoAddress: SuggestionItem) => {
                void testAddressEligibility(geoAddress);
              }}
              onClear={() => {
                void setAddress(null);
                setAddressDetail(null);
              }}
            />
            <Radio
              name="radio"
              options={[
                {
                  illustration: <img alt="illustration" src="/img/picto_logement_immeuble_chauffage_collectif.svg" />,
                  label: 'Immeuble à chauffage collectif',
                  nativeInputProps: {
                    value: 'immeuble_chauffage_collectif' satisfies TypeLogement,
                    checked: typeLogement === 'immeuble_chauffage_collectif',
                    onChange: (e) => setTypeLogement(e.target.value as TypeLogement),
                  },
                },
                {
                  illustration: <img alt="illustration" src="/img/picto_logement_immeuble_chauffage_individuel.svg" />,
                  label: 'Immeuble à chauffage individuel',
                  nativeInputProps: {
                    value: 'immeuble_chauffage_individuel' satisfies TypeLogement,
                    checked: typeLogement === 'immeuble_chauffage_individuel',
                    onChange: (e) => setTypeLogement(e.target.value as TypeLogement),
                  },
                },
                {
                  illustration: <img alt="illustration" src="/img/picto_logement_maison_individuelle.svg" />,
                  label: 'Maison individuelle',
                  nativeInputProps: {
                    value: 'maison_individuelle' satisfies TypeLogement,
                    checked: typeLogement === 'maison_individuelle',
                    onChange: (e) => setTypeLogement(e.target.value as TypeLogement),
                  },
                },
              ]}
            />
          </div>
          <div className="flex-[5]! py-6 lg:mt-28">
            {isDefined(typeLogement) && isDefined(addressDetail) ? (
              <ChoixChauffageResults typeLogement={typeLogement} addressDetail={addressDetail} />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="italic text-center fr-px-6w">
                  Renseignez votre adresse et sélectionnez un type de bâtiment pour découvrir les modes de chauffage décarbonés les plus
                  pertinents
                </div>
                <img src="/img/picto_chauffage_ecologique.svg" alt="" />
              </div>
            )}
          </div>
        </SectionTwoColumns>
      </SectionContent>
    </Section>
  );
}

export default ChoixChauffageForm;
