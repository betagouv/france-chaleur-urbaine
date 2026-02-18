import { espaceExterieurOptions } from '@/components/choix-chauffage/modesChauffageData';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import Select from '@/components/form/dsfr/Select';
import RichSelect from '@/components/ui/RichSelect';
import type { EspaceExterieur } from '@/modules/app/types';

type Props = {
  withLabel: boolean;
  typeLogement: TypeLogement | null;
  setTypeLogement: (val: TypeLogement | null) => void;
  espaceExterieur: EspaceExterieur | null;
  setEspaceExterieur: (val: EspaceExterieur | null) => void;
};

export function SettingsTopFields({ withLabel, typeLogement, setTypeLogement, espaceExterieur, setEspaceExterieur }: Props) {
  return (
    <>
      <Select
        label={withLabel ? 'Mode de chauffage' : ''}
        options={[
          { label: 'Immeuble en chauffage collectif', value: 'immeuble_chauffage_collectif' satisfies TypeLogement },
          { label: 'Immeuble en chauffage individuel', value: 'immeuble_chauffage_individuel' satisfies TypeLogement },
          { label: 'Maison individuelle', value: 'maison_individuelle' satisfies TypeLogement },
        ]}
        nativeSelectProps={{
          onChange: (e) => void setTypeLogement(e.target.value as TypeLogement),
          value: typeLogement ?? '',
        }}
      />

      <RichSelect<EspaceExterieur>
        value={espaceExterieur ?? undefined}
        onChange={(val) => void setEspaceExterieur(val)}
        options={[...espaceExterieurOptions]}
        placeholder="Sélectionner vos espaces disponibles"
        label={withLabel ? 'Espaces extérieurs disponibles' : ''}
      />
    </>
  );
}
