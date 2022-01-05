import styled from 'styled-components';

type MarkdownWrapperStyledProps = {
  className?: string;
};
export const MarkdownWrapperStyled = styled.div.attrs<MarkdownWrapperStyledProps>(
  ({ className }: MarkdownWrapperStyledProps) => ({
    className: `md-wrapper ${className || ''}`,
  })
)<MarkdownWrapperStyledProps>`
  h1,
  h2 {
    color: #000074;
  }
  h3,
  h4,
  h5 {
    color: #4550e5;
  }
  h1 + h1,
  h2 + h2,
  h3 + h3,
  h4 + h4,
  h5 + h5 {
    margin-top: calc(-1rem + 0.25rem);
  }

  p {
    margin-bottom: 1em;
  }

  em {
    color: #4550e5;
    font-style: normal;
  }
  strong {
    color: #4550e5;

    em {
      color: #293173;
      font-style: normal;
    }
  }
`;

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
