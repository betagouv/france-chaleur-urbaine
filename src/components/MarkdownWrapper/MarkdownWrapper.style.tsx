import Link from 'next/link';
import type { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { legacyColors } from '@/components/ui/helpers/colors';
import { type TrackingEvent, trackEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

export const isExternalLink = (href: string) => href && href.search(/(^http)|(^mailto)|(^\/documentation)/) >= 0;

type MarkdownWrapperStyledProps = {
  className?: string;
  withPadding?: boolean;
};
export const MarkdownWrapperStyled = styled.div.attrs<MarkdownWrapperStyledProps>(({ className }: MarkdownWrapperStyledProps) => ({
  className: `md-wrapper ${className || ''}`,
}))<MarkdownWrapperStyledProps>`
  ${({ withPadding, theme }) =>
    withPadding &&
    theme.media.lg`
      padding: 0 3rem;
    `}
  ${({ color }) => css`
    h1,
    h2 {
      color: ${color || 'var(--legacy-darker-blue)'};
    }
    h3,
    h4 {
      color: ${color || legacyColors.lightblue};
    }
    h5,
    h6 {
      color: ${color || 'var(--bf500)'};
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

    div {
      color: ${color};
    }

    em {
      color: ${color || legacyColors.lightblue};

      font-style: normal;
      strong {
        font-size: 14px;
      }
    }
    strong {
      color: ${color || legacyColors.lightblue};

      em {
        color: ${color || '#293173'};
        font-style: normal;
      }
    }
  `}
`;

type ExtraEventType = {
  children: React.ReactNode;
  className?: string;
  eventKey?: TrackingEvent;
  eventPayload?: string;
};

export const ExtraLink = styled(Link).attrs<ExtraEventType>((props) => {
  const { className, eventKey, eventPayload, ...rest } = props;
  const trackEventProps = eventKey
    ? {
        onClick: () => {
          trackEvent(
            eventKey,
            eventPayload?.split(',').map((v) => v.trim())
          );
        },
      }
    : {};
  return {
    ...rest,
    ...trackEventProps,
    className,
  };
})<ExtraEventType>``;

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
  background-color: ${legacyColors.lightblue};

  float: left;
  margin: -0.4em 0.6em -0.2em 0em;

  ${({ theme }) => theme.media.lg`
    position: absolute;
    left: 0;
    margin: 0;
    float: none;
  `}
`;

export const Cartridge = styled.div<{ themeColor: string }>`
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

    ${({ themeColor }) => {
      switch (themeColor) {
        case 'color':
        case 'blue': {
          return css`
            background-color: ${legacyColors.lightblue};
            color: #fff;
          `;
        }
        case 'white': {
          return css`
            border: 1px solid #d2d4f0;
            background-color: white;
            color: ${legacyColors.lightblue};
          `;
        }
        case 'yellow': {
          return css`
            background-color: #efc73f;
            color: ${legacyColors.lightblue};
          `;
        }
        case 'grey': {
          return css`
            background-color: #f9f8f6;
            border: 1px solid #e7e7e7;
            color: ${legacyColors.lightblue};
          `;
        }
      }
    }}
  }
`;

const CheckItemFCU = css`
  &:not(:last-child) {
    margin-bottom: 12px;
  }
  display: flex;
  align-items: center;

  color: ${legacyColors.lightblue};

  &::before {
    content: '';
    display: inline;
    padding-top: 0.15rem;
    margin-right: 0.5rem;
    margin-bottom: 4px;
    color: ${legacyColors.lightblue};
    padding: 0;
    line-height: 1;

    background-image: url('/icons/check.svg');
    background-repeat: no-repeat;
    background-position: 0 0.5em;
    background-size: 1em;
    padding-left: calc(1em + 0.15em);
    min-height: calc(1em + 0.75em);
  }
`;

export const WhiteCheckItem = styled.div`
  ${CheckItemFCU}
  color: white;
  margin-bottom: 0;
  &::before {
    margin-bottom: 4px;
    font-size: 35px;
    background-image: url('/icons/picto-check.svg');
  }
`;

const ArrowPuce = styled.span.attrs(() => ({
  'aria-hidden': 'true',
  className: 'fr-icon-arrow-right-circle-fill',
}))<{ $color?: 'default' | 'white' }>`
  color: ${({ $color }) => ($color === 'white' ? 'white' : 'var(--text-label-blue-france)')};
`;

export const ArrowItem = ({
  children,
  color = 'default',
  className,
}: {
  children: ReactNode;
  color?: 'default' | 'white';
  className?: string;
}) => (
  <div className={cx('flex gap-2 fr-mb-3w', color === 'white' && 'text-white', className ?? '')}>
    <ArrowPuce $color={color} />
    <div>{children}</div>
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
