import styled, { css } from 'styled-components';

export const isExternalLink = (href: string) =>
  href?.search(/(^http)|(^mailto)/) >= 0;

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
  h4 {
    color: #4550e5;
  }
  h5,
  h6 {
    color: var(--bf500);
  }
  h1 + h1,
  h2 + h2,
  h3 + h3,
  h4 + h4,
  h5 + h5,
  h6 + h6 {
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

export const ButtonLink = styled.a.attrs({ className: 'fr-btn' })``;

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

export const Cartridge = styled.p<{ theme: string }>`
  display: inline-block;
  background-color: #ffdecf;
  margin: 0 -0.55em;
  padding: 0.35em 0.55em;
  border-radius: 0.7em;

  & > & {
    margin: 0;
  }
  &:not(.surcharge) {
    p,
    strong,
    em,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      color: currentColor;
    }

    ${({ theme }) => {
      switch (theme) {
        case 'color':
        case 'blue': {
          return css`
            background-color: #4550e5;
            color: #fff;
          `;
        }
        case 'yellow': {
          return css`
            background-color: #efc73f;
            color: #4550e5;
          `;
        }
        case 'grey': {
          return css`
            background-color: #f9f8f6;
            border: 1px solid #e7e7e7;
            color: #4550e5;
          `;
        }
      }
    }}
  }
`;

const CheckItemFCU = css`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;

  color: #4550e5;

  &::before {
    content: '';
    display: block;
    padding-top: 0.15rem;
    margin-right: 0.5rem;
    color: #4550e5;
    padding: 0;
    line-height: 1;

    background-image: url('./icons/check.svg');
    background-repeat: no-repeat;
    background-position: 0 0.5em;
    background-size: 1em;
    padding-left: calc(1em + 0.15em);
    min-height: calc(1em + 0.75em);
  }
`;

const CheckItemDefault = styled.div.attrs({
  className: 'fr-fi-checkbox-circle-fill list-item',
})`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;

  color: #4550e5;

  &::before {
    display: block;
    padding-top: 0.15rem;
    margin-right: 0.5rem;
    color: #2fab73;
    padding: 0;
    line-height: 1;
  }
`;

type CheckItemType = {
  checked?: boolean;
  className?: string;
};
export const CheckItem = styled.div.attrs<CheckItemType>(
  ({ checked, className }) => ({
    className: checked
      ? `fr-fi-checkbox-circle-fill list-item ${className}`
      : className,
  })
)<CheckItemType>`
  ${({ checked }) => (checked ? CheckItemDefault : CheckItemFCU)}
`;

type PuceIconType = {
  icon: string;
};

export const PuceIcon = styled.div<PuceIconType>`
  background-image: url(${({ icon }) => icon || ''});
  background-repeat: no-repeat;
  background-position: 0 0.5em;
  background-size: 70px;
  padding-left: calc(70px + 0.75em);
  min-height: calc(70px + 1.5em);
`;

export const KnowMoreLink = styled.a.attrs(({ href }) => ({
  className: 'fr-fi-arrow-right-s-line list-item',
  children: 'En savoir plus',
  target: href && isExternalLink(href) ? '_blank' : undefined,
}))`
  --link-underline: none;
  text-decoration: none;
  color: #4550e5;
  display: inline-block;
  margin-left: -0.4em;
  font-size: 0.8em;

  &::before {
    font-size: 1em;
  }

  &::after {
    content: unset;
  }
`;
