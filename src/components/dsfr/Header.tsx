// Source: https://github.com/codegouvfr/react-dsfr/blob/fcc1fe8b51e0946252121834e400efb6151e77fd/src/Header/Header.tsx - Change L187
/* eslint-disable no-inner-declarations */

import { fr } from '@codegouvfr/react-dsfr/fr';
import type { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr/fr/generatedFromCss/classNames';
import { createComponentI18nApi } from '@codegouvfr/react-dsfr/i18n';
import type { RegisteredLinkProps } from '@codegouvfr/react-dsfr/link';
import { getLink } from '@codegouvfr/react-dsfr/link';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { MainNavigation } from '@codegouvfr/react-dsfr/MainNavigation';
import { useTranslation as useSearchBarTranslation } from '@codegouvfr/react-dsfr/SearchBar/SearchBar';
import { SearchButton } from '@codegouvfr/react-dsfr/SearchBar/SearchButton';
import { cx } from '@codegouvfr/react-dsfr/tools/cx';
import { setBrandTopAndHomeLinkProps } from '@codegouvfr/react-dsfr/zz_internal/brandTopAndHomeLinkProps';
import { cloneElement, forwardRef, memo, type CSSProperties, type ComponentProps, type ReactNode } from 'react';
import type { Equals } from 'tsafe';
import { assert } from 'tsafe/assert';
import { symToStr } from 'tsafe/symToStr';
import { typeGuard } from 'tsafe/typeGuard';

export type HeaderProps = {
  className?: string;
  id?: string;
  brandTop: ReactNode;
  homeLinkProps: RegisteredLinkProps & { title: string };
  serviceTitle?: ReactNode;
  serviceTagline?: ReactNode;
  navigation?: MainNavigationProps.Item[] | ReactNode;
  /** There should be at most three of them */
  quickAccessItems?: (HeaderProps.QuickAccessItem | JSX.Element | null)[];
  operatorLogo?: {
    orientation: 'horizontal' | 'vertical';
    /**
     * Expected ratio:
     * If "vertical": 9x16
     * If "horizontal": 16x9
     */
    imgUrl: string;
    /** Textual alternative of the image, it MUST include the text present in the image */
    alt: string;
    /**
     * Custom link props, if not provided, the operator logo will be wrapped in a link that points to the home page
     */
    linkProps?: RegisteredLinkProps & { title: string };
  };
  renderSearchInput?: (
    /**
     * id and name must be forwarded to the <input /> component
     * the others params can, but it's not mandatory.
     **/
    params: {
      id: string;
      type: 'search';
      className: string;
      placeholder: string;
    }
  ) => JSX.Element;
  /** Called when the search button is clicked */
  onSearchButtonClick?: (text: string) => void;
  /** Default: false */
  clearSearchInputOnSearch?: boolean;
  /** Default: false */
  allowEmptySearch?: boolean;
  classes?: Partial<
    Record<
      | 'root'
      | 'body'
      | 'container'
      | 'bodyRow'
      | 'brand'
      | 'brandTop'
      | 'logo'
      | 'operator'
      | 'navbar'
      | 'service'
      | 'serviceTitle'
      | 'serviceTagline'
      | 'toolsLinks'
      | 'menu'
      | 'menuLinks',
      string
    >
  >;
  style?: CSSProperties;
};

export namespace HeaderProps {
  export type QuickAccessItem = QuickAccessItem.Link | QuickAccessItem.Button;

  export namespace QuickAccessItem {
    export type Common = {
      iconId: FrIconClassName | RiIconClassName;
      text: ReactNode;
    };

    export type Link = Common & {
      linkProps: RegisteredLinkProps;
      buttonProps?: never;
    };

    export type Button = Common & {
      linkProps?: never;
      buttonProps: ComponentProps<'button'> & Record<`data-${string}`, string | boolean | null | undefined>;
    };
  }
}

export const headerMenuModalIdPrefix = 'header-menu-modal';

/** @see <https://components.react-dsfr.codegouv.studio/?path=/docs/components-header> */
export const Header = memo(
  forwardRef<HTMLDivElement, HeaderProps>((props, ref) => {
    const {
      className,
      id: id_props,
      brandTop,
      serviceTitle,
      serviceTagline,
      homeLinkProps,
      navigation = undefined,
      quickAccessItems = [],
      operatorLogo,
      renderSearchInput,
      clearSearchInputOnSearch = false,
      allowEmptySearch = false,
      onSearchButtonClick,
      classes = {},
      style,
      ...rest
    } = props;

    assert<Equals<keyof typeof rest, never>>();

    const id = id_props ?? 'fr-header';

    const menuModalId = `${headerMenuModalIdPrefix}-${id}`;
    const menuButtonId = `${id}-menu-button`;
    const searchModalId = `${id}-search-modal`;
    const searchInputId = `${id}-search-input`;

    const isSearchBarEnabled = renderSearchInput !== undefined || onSearchButtonClick !== undefined;

    setBrandTopAndHomeLinkProps({ brandTop, homeLinkProps });

    const { t } = useTranslation();
    const { t: tSearchBar } = useSearchBarTranslation();

    const { Link } = getLink();

    const getQuickAccessNode = (usecase: 'mobile' | 'desktop') => (
      <ul className={fr.cx('fr-btns-group')}>
        {quickAccessItems.map((quickAccessItem, i) => (
          <li key={i}>
            {(() => {
              const node = !typeGuard<HeaderProps.QuickAccessItem>(
                quickAccessItem,
                quickAccessItem instanceof Object && 'text' in quickAccessItem
              ) ? (
                quickAccessItem
              ) : (
                <HeaderQuickAccessItem quickAccessItem={quickAccessItem} />
              );

              if (node === null) {
                return null;
              }

              return cloneElement(node, {
                id: `${id}-quick-access-item-${i}${(() => {
                  switch (usecase) {
                    case 'mobile':
                      return '-mobile';
                    case 'desktop':
                      return '';
                  }
                })()}`,
              });
            })()}
          </li>
        ))}
      </ul>
    );
    const hasOperatorLink = operatorLogo?.linkProps !== undefined;

    return (
      <>
        {/* <Display /> Removed because it puts a h1 in the code source of the page which breask SEO */}
        <header role="banner" id={id} className={cx(fr.cx('fr-header'), classes.root, className)} ref={ref} style={style} {...rest}>
          <div className={cx(fr.cx('fr-header__body' as any), classes.body)}>
            <div className={cx(fr.cx('fr-container'), classes.container)}>
              <div className={cx(fr.cx('fr-header__body-row'), classes.bodyRow)}>
                <div className={cx(fr.cx('fr-header__brand', !hasOperatorLink && 'fr-enlarge-link'), classes.brand)}>
                  <div className={cx(fr.cx('fr-header__brand-top'), classes.brandTop)}>
                    <div className={cx(fr.cx('fr-header__logo'), classes.logo)}>
                      {(() => {
                        const children = <p className={fr.cx('fr-logo')}>{brandTop}</p>;

                        return serviceTitle !== undefined ? children : <Link {...(homeLinkProps as any)}>{children}</Link>;
                      })()}
                    </div>
                    {operatorLogo !== undefined && (
                      <div className={cx(fr.cx('fr-header__operator', hasOperatorLink && 'fr-enlarge-link'), classes.operator)}>
                        {(() => {
                          const children = (
                            <img
                              className={cx(fr.cx('fr-responsive-img'), classes.operator)}
                              style={(() => {
                                switch (operatorLogo.orientation) {
                                  case 'vertical':
                                    return {
                                      width: '3.5rem',
                                    };
                                  case 'horizontal':
                                    return {
                                      maxWidth: '9.0625rem',
                                    };
                                }
                              })()}
                              src={operatorLogo.imgUrl}
                              alt={operatorLogo.alt}
                            />
                          );

                          return hasOperatorLink ? <Link {...(operatorLogo.linkProps as any)}>{children}</Link> : children;
                        })()}
                      </div>
                    )}

                    {(quickAccessItems.length > 0 || navigation !== undefined || isSearchBarEnabled) && (
                      <div className={cx(fr.cx('fr-header__navbar'), classes.navbar)}>
                        {isSearchBarEnabled && (
                          <button
                            id={`${id}-search-button`}
                            className={fr.cx('fr-btn--search', 'fr-btn')}
                            data-fr-opened={false}
                            aria-controls={searchModalId}
                            title={tSearchBar('label')}
                          >
                            {tSearchBar('label')}
                          </button>
                        )}
                        <button
                          className={fr.cx('fr-btn--menu', 'fr-btn')}
                          data-fr-opened="false"
                          aria-controls={menuModalId}
                          aria-haspopup="menu"
                          id={menuButtonId}
                          title={t('menu')}
                        >
                          {t('menu')}
                        </button>
                      </div>
                    )}
                  </div>
                  {serviceTitle !== undefined && (
                    <div className={cx(fr.cx('fr-header__service', hasOperatorLink && 'fr-enlarge-link'), classes.service)}>
                      <Link {...(homeLinkProps as any)}>
                        <p className={cx(fr.cx('fr-header__service-title'), classes.serviceTitle)}>{serviceTitle}</p>
                      </Link>
                      {serviceTagline !== undefined && (
                        <p className={cx(fr.cx('fr-header__service-tagline' as any), classes.serviceTagline)}>{serviceTagline}</p>
                      )}
                    </div>
                  )}
                </div>

                {(quickAccessItems.length > 0 || isSearchBarEnabled) && (
                  <div className={fr.cx('fr-header__tools')}>
                    {quickAccessItems.length > 0 && (
                      <div className={cx(fr.cx('fr-header__tools-links'), classes.toolsLinks)}>{getQuickAccessNode('desktop')}</div>
                    )}

                    {isSearchBarEnabled && (
                      <div
                        className={fr.cx('fr-header__search', 'fr-modal')}
                        id={searchModalId}
                        aria-labelledby={`${id}-search-bar-button`}
                      >
                        <div className={fr.cx('fr-container', 'fr-container-lg--fluid')}>
                          <button
                            id={`${id}-search-close-button`}
                            className={fr.cx('fr-btn--close', 'fr-btn')}
                            aria-controls={searchModalId}
                            title={t('close')}
                          >
                            {t('close')}
                          </button>
                          <div className={fr.cx('fr-search-bar')} role="search">
                            <label className={fr.cx('fr-label')} htmlFor={searchInputId}>
                              {tSearchBar('label')}
                            </label>
                            {(
                              renderSearchInput ??
                              (({ className, id, placeholder, type }) => (
                                <input className={className} id={id} placeholder={placeholder} type={type} />
                              ))
                            )({
                              className: fr.cx('fr-input'),
                              id: searchInputId,
                              placeholder: tSearchBar('label'),
                              type: 'search',
                            })}
                            <SearchButton
                              id={`${id}-search-bar-button`}
                              searchInputId={searchInputId}
                              onClick={onSearchButtonClick}
                              clearInputOnSearch={clearSearchInputOnSearch}
                              allowEmptySearch={allowEmptySearch}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {(navigation !== undefined || quickAccessItems.length !== 0) && (
            <div className={cx(fr.cx('fr-header__menu', 'fr-modal'), classes.menu)} id={menuModalId} aria-labelledby={menuButtonId}>
              <div className={fr.cx('fr-container')}>
                <button
                  id={`${id}-mobile-overlay-button-close`}
                  className={fr.cx('fr-btn--close', 'fr-btn')}
                  aria-controls={menuModalId}
                  title={t('close')}
                >
                  {t('close')}
                </button>
                <div className={cx(fr.cx('fr-header__menu-links'), classes.menuLinks)}>{getQuickAccessNode('mobile')}</div>
                {navigation !== undefined &&
                  (navigation instanceof Array ? <MainNavigation id={`${id}-main-navigation`} items={navigation} /> : navigation)}
              </div>
            </div>
          )}
        </header>
      </>
    );
  })
);

Header.displayName = symToStr({ Header });

export default Header;

export const { useTranslation, addHeaderTranslations } = createComponentI18nApi({
  componentName: symToStr({ Header }),
  frMessages: {
    /* spell-checker: disable */
    menu: 'Menu',
    close: 'Fermer',
    /* spell-checker: enable */
  },
});

addHeaderTranslations({
  lang: 'en',
  messages: {
    close: 'Close',
  },
});

export type HeaderQuickAccessItemProps = {
  className?: string;
  quickAccessItem: HeaderProps.QuickAccessItem;
  id?: string;
};

/** NOTE: If you wrap this component you should forward the id */
export function HeaderQuickAccessItem(props: HeaderQuickAccessItemProps): JSX.Element {
  const { className, quickAccessItem, id } = props;

  const { Link } = getLink();

  return quickAccessItem.linkProps !== undefined ? (
    <Link
      {...(quickAccessItem.linkProps as any)}
      className={cx(fr.cx('fr-btn', quickAccessItem.iconId), quickAccessItem.linkProps.className, className)}
      id={id}
    >
      {quickAccessItem.text}
    </Link>
  ) : (
    <button
      {...quickAccessItem.buttonProps}
      className={cx(fr.cx('fr-btn', quickAccessItem.iconId), quickAccessItem.buttonProps.className, className)}
      id={id}
    >
      {quickAccessItem.text}
    </button>
  );
}