import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';
import React from 'react';

type CheckEligibilityFormProps = {
  children?: React.ReactNode;
  label?: React.ReactNode;
  name: string;
  selectOptions?: Record<string, string>;
  cardMode?: boolean;
  value: string;
  onChange?: (e: any) => void;
  className?: string;
};

const SelectEnergy: React.FC<CheckEligibilityFormProps> = ({
  children,
  label,
  name,
  cardMode,
  selectOptions = {},
  // value,
  onChange,
  // className,
}) => {
  // const options = useMemo(() => {
  //   return Object.entries(selectOptions).map(([value, label]) => (
  //     <Radio
  //       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //       // @ts-ignore: to fix in react-dsfr
  //       name={name}
  //       key={value}
  //       label={label}
  //       value={value}
  //       onChange={onChange}
  //     />
  //   ));
  // }, [onChange, name, selectOptions]);

  return (
    <>
      {/* <div>
        legend={(label as string) || 'Chauffage actuel :'}
        name={name}
        isInline={!cardMode}
        required
        value={value}
        className={`fr-mb-2w ${className}`}
      >
        {options}
      </div> */}

      {children}
      <RadioButtons
        legend={label ?? 'Chauffage actuel :'}
        name={name}
        orientation={cardMode ? 'vertical' : 'horizontal'}
        options={Object.entries(selectOptions).map(([value, label]) => ({
          label: label,
          nativeInputProps: {
            value: value,
            // FIXME vérifier
            // checked: value === optionValue,
            onChange: onChange,
          },
        }))}
      />
    </>
  );
};

export default SelectEnergy;
