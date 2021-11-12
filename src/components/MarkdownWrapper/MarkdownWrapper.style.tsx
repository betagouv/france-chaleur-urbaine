import styled from 'styled-components';

type MarkdownWrapperStyledProps = {
  className?: string;
};
export const MarkdownWrapperStyled = styled.div.attrs<MarkdownWrapperStyledProps>(
  ({ className }: MarkdownWrapperStyledProps) => ({
    className: `md-wrapper ${className || ''}`,
  })
)<MarkdownWrapperStyledProps>`
  p {
    margin-bottom: 1em;
  }
`;
