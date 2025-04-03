// @ts-nocheck
/* eslint-disable */
'use client';

import { fr } from '@codegouvfr/react-dsfr/fr';
import type { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import { getLink } from '@codegouvfr/react-dsfr/link';
import { cx } from '@codegouvfr/react-dsfr/tools/cx';
import { generateValidHtmlId } from '@codegouvfr/react-dsfr/tools/generateValidHtmlId';
import React, { type CSSProperties, forwardRef, memo, type ReactNode } from 'react';
import type { Equals } from 'tsafe';
import { assert } from 'tsafe/assert';
import { symToStr } from 'tsafe/symToStr';

import Link from '@/components/ui/Link';

export type MenuProps = {
  classes?: Partial<Record<'root' | 'list', string>>;
  style?: CSSProperties;
  links: MenuProps.Link[];
};

export namespace MenuProps {
  export type Link = {
    text: ReactNode;
    linkProps: RegisteredLinkProps;
    isActive?: boolean;
  };
}

export const Menu = memo(
  forwardRef<HTMLDivElement, MenuProps & { id: string }>((props, ref) => {
    const { id, classes = {}, style, links, ...rest } = props;

    assert<Equals<keyof typeof rest, never>>();

    // const { Link } = getLink();

    return (
      <div className={cx(fr.cx('fr-menu'), classes.root)} style={style} id={id} ref={ref} {...rest}>
        <ul className={cx(fr.cx('fr-menu__list'), classes.list)}>
          {links.map(({ text, linkProps, isActive = false }, i) => (
            <li key={i}>
              <Link
                {...linkProps}
                id={
                  linkProps.id ??
                  `${id}-link${generateValidHtmlId({
                    text,
                  })}-${i}`
                }
                className={cx(fr.cx('fr-nav__link'), linkProps.className)}
                {...(isActive && { ['aria-current']: 'page' })}
              >
                {text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  })
);

Menu.displayName = symToStr({ Menu });

export default Menu;
