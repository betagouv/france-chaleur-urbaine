import styled from 'styled-components';

const isExternalLink = (href: string) => href?.search(/(^http)|(^mailto)/) >= 0;

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

export const MyLink = styled.a.attrs(({ href }) => ({
  target: href && isExternalLink(href) ? '_blank' : undefined,
  rel:
    href && isExternalLink(href)
      ? ['nofollow', 'noopener', 'noreferrer'].join(' ')
      : '',
}))``;
