import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';

import Radio from '@/components/form/dsfr/Radio';
import useInViewport from '@/hooks/useInViewport';

import { usePublicodesFormContext } from './FormProvider';
import { fixupBooleanEngineValue, getOptions } from './helpers';
import Label from './Label';
import labels from './labels';

export type RadioProps = React.ComponentProps<typeof Radio>;
export type RadioOption = { value: string | number; label?: string };

const RadioInput = ({
  name,
  label,
  help,
  ...props
}: Omit<RadioProps, 'options' | 'name'> & {
  name: DottedName;
  label?: keyof typeof labels | string;
  help?: React.ReactNode;
}) => {
  const [ref, isInView] = useInViewport<HTMLFieldSetElement>();
  const { engine } = usePublicodesFormContext();

  const options = isInView ? getOptions(engine, name) : [];
  const valueInEngine = isInView ? fixupBooleanEngineValue(engine.getField(name)) : '';

  const displayLabel = label ? label : name in labels ? labels[name as keyof typeof labels] : name;

  return (
    <Radio
      ref={ref}
      name={name}
      options={options.map((optionValue) => ({
        label: optionValue,
        nativeInputProps: {
          checked: optionValue === valueInEngine,
          value: optionValue,
          onChange: (e) => {
            e.stopPropagation();
            const value = e.target.value;
            if (['oui', 'non'].includes(value)) {
              engine.setField(name, value);
            } else {
              engine.setStringField(name, value);
            }
          },
        },
      }))}
      label={<Label label={displayLabel} help={help} />}
      // state={props.state ?? fieldState.error ? 'error' : 'default'}
      // stateRelatedMessage={props.stateRelatedMessage ?? fieldState.error?.message}
      {...props}
    />
  );
};

export default RadioInput;
