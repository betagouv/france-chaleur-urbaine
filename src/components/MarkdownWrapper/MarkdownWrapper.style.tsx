import markupData, { matomoEvent } from '@components/Markup';
import styled, { css } from 'styled-components';

export const isExternalLink = (href: string) =>
  href && href.search(/(^http)|(^mailto)/) >= 0;

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
    font-size: inherit;
    line-height: inherit;
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

type TagName = keyof typeof markupData;
type ExtraEventType = {
  children: React.ReactNode;
  className?: string;
  tagName?: TagName;
  trackEvent?: string;
};

export const ButtonLink = styled.a.attrs(
  (props: React.HTMLProps<HTMLLinkElement> & ExtraEventType) => {
    const { className, tagName, trackEvent } = props;
    const getMatomoEventKey = (tagName?: TagName) =>
      (tagName && markupData?.[tagName]?.matomoEvent) || [];
    const trackEventProps = trackEvent
      ? {
          onClick: () => {
            matomoEvent(
              getMatomoEventKey(tagName),
              trackEvent.split(',').map((v) => v.trim())
            );
          },
        }
      : {};
    return {
      ...props,
      ...trackEventProps,
      className: `fr-btn ${className || ''}`,
    };
  }
)`
  margin-bottom: 16px;
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

  float: left;
  margin: -0.4em 0.6em -0.2em 0em;

  @media (min-width: 992px) {
    position: absolute;
    left: 0;
    margin: 0;
    float: none;
  }
`;

export const Cartridge = styled.div<{ theme: string }>`
  display: inline-block;
  background-color: #ffdecf;
  padding: 8px 16px;
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
      color: currentColor !important;
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

const CountPuce = styled.div`
  display: inline-block;
  margin-right: 8px;
  background-color: #4550e5;
  color: white;
  width: 23px;
  height: 23px;
  font-size: 14px;
  border-radius: 50%;
  text-align: center;
`;

export const CountItem = ({
  number,
  children,
}: {
  number: number;
  children: string;
}) => (
  <div>
    <CountPuce>{number}</CountPuce>
    {children}
  </div>
);

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
