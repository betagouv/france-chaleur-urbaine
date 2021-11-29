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

export const CounterItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 1.45rem;
  padding: 1em;
  margin: 0.25em 0 0;
  width: 3.15em;
  height: 3.15em;
  border-radius: 100%;
  background-color: #4550e5;

  position: absolute;
  left: 0;
`;

export const Cartridge = styled.p`
  display: inline-block;
  background-color: #ffdecf;
  margin: 0 -0.55em;
  padding: 0.35em 0.55em;
  border-radius: 0.7em;
`;

export const PuceIcon = styled.div<{ icon: string }>`
  background-image: url(${({ icon }) => icon || ''});
  background-repeat: no-repeat;
  background-position: 0 0.5em;
  background-size: 70px;
  padding-left: calc(70px + 0.75em);
  min-height: calc(70px + 1.5em);

  &:first-of-type {
    margin-top: 3em;
  }
`;
