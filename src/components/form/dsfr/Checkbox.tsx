import DsfrCheckbox, { type CheckboxProps as DsfrCheckboxProps } from '@codegouvfr/react-dsfr/Checkbox';
import styled, { css } from 'styled-components';

const StyledCheckbox = styled(DsfrCheckbox)<{
  small?: boolean;
}>`
  ${({ small }) => css`
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
  `}
`;

export type CheckboxProps = DsfrCheckboxProps & {};

const Checkbox: React.FC<CheckboxProps> = ({ ...props }) => {
  return <StyledCheckbox {...props} />;
};

export default Checkbox;
