import { useMemo } from 'react';

import type { DPE } from '@/components/choix-chauffage/modesChauffageData';
import { DPE_ORDER } from '@/components/choix-chauffage/modesChauffageData';
import type { TypeLogement } from '@/components/choix-chauffage/type-logement';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import type { EspaceExterieur } from '@/modules/app/types';
import cx from '@/utils/cx';

import { SettingsTopFields } from './SettingsTopFields';

const isNumericLike = (v: string) => v === '' || /^[0-9]+([.,][0-9]*)?$/.test(v);

type ParamsFormProps = {
  isOpen: boolean;
  setIsOpen: (next: boolean | ((prev: boolean) => boolean)) => void;

  typeLogement: TypeLogement | null;
  setTypeLogement: (val: TypeLogement | null) => void;
  espaceExterieur: EspaceExterieur | null;
  setEspaceExterieur: (val: EspaceExterieur | null) => void;

  dpe: DPE;
  setDpe: (val: DPE) => void;

  nbLogements: number;
  setNbLogements: (val: number) => void;

  surfaceMoyenne: number;
  setSurfaceMoyenne: (val: number) => void;

  habitantsMoyen: string;
  setHabitantsMoyen: (val: string) => void;
};

export function ParamsForm({
  isOpen,
  setIsOpen,
  typeLogement,
  setTypeLogement,
  espaceExterieur,
  setEspaceExterieur,
  dpe,
  setDpe,
  nbLogements,
  setNbLogements,
  surfaceMoyenne,
  setSurfaceMoyenne,
  habitantsMoyen,
  setHabitantsMoyen,
}: ParamsFormProps) {
  const ariaControlsId = useMemo(() => 'params-form', []);

  return (
    <>
      {/* Toggle mobile */}
      <div className="md:hidden fr-my-2w">
        <Button
          full
          priority="secondary"
          iconId={isOpen ? 'fr-icon-close-line' : 'fr-icon-add-line'}
          iconPosition="right"
          aria-expanded={isOpen}
          aria-controls={ariaControlsId}
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? 'Fermer' : 'Ouvrir'} les paramètres
        </Button>
      </div>

      <div
        id={ariaControlsId}
        className={cx('border border-gray-200 rounded shadow-lg p-4 fr-mb-3w', 'md:block', isOpen ? 'block' : 'hidden')}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Image src="/icons/icon-warning.png" alt="icone d'engrenage" aria-hidden="true" width="24" height="24" />
          Renseignez ces informations pour afficher des coûts affinés
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div className="md:hidden mb-6 md:mb-0">
            <SettingsTopFields
              withLabel
              typeLogement={typeLogement}
              setTypeLogement={setTypeLogement}
              espaceExterieur={espaceExterieur}
              setEspaceExterieur={setEspaceExterieur}
            />
          </div>

          <Select
            label="DPE (étiquette énergétique)"
            options={DPE_ORDER.map((i) => ({ label: i, value: i }))}
            nativeSelectProps={{
              onChange: (e) => void setDpe(e.target.value as DPE),
              value: dpe,
            }}
          />

          <Input
            label="Nombre de logements"
            nativeInputProps={{
              inputMode: 'numeric',
              min: 1,
              onBlur: () => {
                if ((nbLogements ?? 0) < 1) void setNbLogements(1);
              },
              onChange: (e) => {
                const raw = e.target.value;
                const next = raw === '' ? 0 : Number(raw);
                void setNbLogements(next);
              },
              placeholder: '-',
              required: true,
              type: 'number',
              value: nbLogements,
            }}
          />

          <Input
            label="Surface moyenne / logement"
            nativeInputProps={{
              inputMode: 'numeric',
              min: 0,
              onChange: (e) => {
                const raw = e.target.value;
                const next = raw === '' ? 0 : Number(raw);
                void setSurfaceMoyenne(next);
              },
              placeholder: '- m²',
              required: true,
              type: 'number',
              value: surfaceMoyenne,
            }}
          />

          <Input
            label="Habitants moyen / logement"
            nativeInputProps={{
              inputMode: 'decimal',
              min: 0,
              onBlur: () => {
                const normalized = (habitantsMoyen ?? '').replace(',', '.').replace(/\.$/, '');
                if (normalized === '') {
                  void setHabitantsMoyen('');
                  return;
                }
                const n = Number(normalized);
                if (!Number.isFinite(n) || n < 0) {
                  void setHabitantsMoyen('');
                  return;
                }
                void setHabitantsMoyen(String(n));
              },
              onChange: (e) => {
                const raw = e.target.value;
                if (!isNumericLike(raw)) return;
                void setHabitantsMoyen(raw);
              },
              placeholder: '-',
              required: true,
              step: 0.1,
              type: 'number',
              value: habitantsMoyen,
            }}
          />
        </div>
      </div>
    </>
  );
}
