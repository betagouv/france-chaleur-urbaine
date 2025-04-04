import DsfrCheckbox, { type CheckboxProps as DsfrCheckboxProps } from '@codegouvfr/react-dsfr/Checkbox';
import styled, { css } from 'styled-components';

const StyledCheckbox = styled(DsfrCheckbox)<{
  small?: boolean;
  $fullWidth?: boolean;
}>`
  ${({ small, $fullWidth }) => css`
    ${small &&
    css`
      .fr-fieldset__content .fr-radio-group label,
      .fr-fieldset__content .fr-checkbox-group label {
        padding: 0.25rem 0;
      }
      .fr-fieldset__content .fr-radio-group:not(.fr-radio-rich) input[type='radio'] + label::before,
      .fr-fieldset__content .fr-checkbox-group input[type='checkbox'] + label::before {
        top: 0.25rem;
      }
      .fr-label {
        font-size: 0.875rem;
      }
    `}
    ${!$fullWidth &&
    css`
      .fr-label {
        display: inline-flex !important; /* Prevent label to be clickable on the whole line even when label is small */
      }
    `}
  `}
`;

export type CheckboxesProps = Omit<DsfrCheckboxProps, 'legend'> & {
  fullWidth?: boolean;
  label?: DsfrCheckboxProps['legend'];
};

const Checkboxes: React.FC<CheckboxesProps> = ({ fullWidth = true, label, ...props }) => {
  // HACK to force the checkbox to be re-rendered when the options change from outside
  const key = props.options.map(({ nativeInputProps: { value } }) => value).join('_');
  return <StyledCheckbox legend={label} key={key} $fullWidth={fullWidth} {...props} />;
};

export default Checkboxes;
