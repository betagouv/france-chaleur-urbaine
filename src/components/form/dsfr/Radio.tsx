import { RadioButtons as DSFRRadioButtons, type RadioButtonsProps as DSFRRadioButtonsProps } from '@codegouvfr/react-dsfr/RadioButtons';
import { forwardRef } from 'react';

export type RadioProps = Omit<DSFRRadioButtonsProps, 'legend'> & {
  label?: React.ReactNode;
};

const Radio = forwardRef<HTMLFieldSetElement, RadioProps>(({ label, ...props }, ref) => {
  return <DSFRRadioButtons ref={ref} legend={label} {...props} />;
});

Radio.displayName = 'Radio';

export default Radio;
