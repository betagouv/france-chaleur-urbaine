import { fr } from '@codegouvfr/react-dsfr';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { type HeaderProps, HeaderQuickAccessItem } from '@codegouvfr/react-dsfr/Header';
import UnstyledMainNavigation, { type MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { useRouter } from 'next/router';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { adminPageGroups, adminPages } from '@/components/Admin/adminPages';
import { FooterConsentManagementItem } from '@/components/ConsentBanner';
import SEO, { type SEOProps } from '@/components/SEO';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import { useHeaderHeightVar } from '@/hooks/useHeaderHeightVar';
import useRouterReady from '@/hooks/useRouterReady';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useAuthentication } from '@/modules/auth/client/hooks';
import cx from '@/utils/cx';
import { deleteFetchJSON } from '@/utils/network';

import { StyledHeader } from './SimplePage.styles';

type PageMode = 'public' | 'public-fullscreen' | 'authenticated';

type SimplePageProps = {
  children: React.ReactNode;
  mode?: PageMode;
  currentPage?: string;
  includeFooter?: boolean;
  layout?: 'center' | 'fluid' | 'large';
  className?: string;
} & SEOProps;

const SimplePage = ({
  mode,
  currentPage,
  children,
  noIndex,
  includeFooter = true,
  layout = 'fluid',
  className,
  ...props
}: SimplePageProps) => {
  // Exposes the real header height as `--header-height` for full-screen layouts.
  useHeaderHeightVar();
  return (
    <>
      <SEO noIndex={mode === 'authenticated' ? true : noIndex} {...props} />
      <SkipLinks
        links={[
          { anchor: '#main-content', label: 'Contenu' },
          { anchor: '#main-header', label: 'Navigation' },
          { anchor: '#main-footer', label: 'Pied de page' },
        ]}
      />
      <PageHeader mode={mode ?? 'public'} currentPage={currentPage} />

      <main
        id="main-content"
        className={cx(
          layout === 'center' ? 'fr-container fr-my-2w' : layout === 'large' ? 'fr-mx-4w fr-my-2w flex flex-col items-start' : '',
          className
        )}
      >
        {children}
      </main>
      {includeFooter && <PageFooter />}
    </>
  );
};

const MainNavigation = styled(UnstyledMainNavigation)<{ $compact?: boolean }>`
  ${({ $compact, theme }) => theme.media.lg`
    .fr-nav__link,
    .fr-nav__btn {
      display: flex;
      align-items: center;
      line-height: 1.25rem;
      ${
        $compact && // to have one line
        css`
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        `
      }
    }
  `}
`;

export default SimplePage;

export const publicNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'accueil', menu_level: 1 }),
    },
    text: 'Accueil',
  },
  {
    linkProps: {
      href: '/comparateur-couts-performances',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'comparateur', menu_level: 1 }),
    },
    text: 'Combien ça coûte ?',
  },
  {
    linkProps: {
      href: '/carte',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'carte', menu_level: 1 }),
    },
    text: 'Carte des réseaux',
  },
  {
    menuLinks: [
      {
        linkProps: {
          href: '/reseaux',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'liste_reseau', menu_level: 2 }),
        },
        text: 'Liste des réseaux de chaleur',
      },
      {
        linkProps: {
          href: '/actus',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'actus', menu_level: 2 }),
        },
        text: 'Actualités',
      },
      {
        linkProps: {
          href: '/ressources/articles',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'articles', menu_level: 2 }),
        },
        text: 'Articles',
      },
      {
        linkProps: {
          href: '/ressources/supports',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'supports', menu_level: 2 }),
        },
        text: 'Supports pédagogiques',
      },
      {
        linkProps: {
          href: '/ressources/actions-de-communication',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'communication', menu_level: 2 }),
        },
        text: 'Actions de communication',
      },
      {
        linkProps: {
          href: '/webinaires',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'webinaire', menu_level: 2 }),
        },
        text: 'Nos replays et présentations',
      },
      {
        linkProps: {
          href: '/ressources/outils',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'outils', menu_level: 2 }),
        },
        text: 'Outils',
      },
    ],
    text: 'Ressources et outils',
  },
  {
    menuLinks: [
      {
        linkProps: {
          href: '/collectivites-et-exploitants',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'collectivite', menu_level: 2 }),
        },
        text: 'France Chaleur Urbaine à votre service',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants#communiquer',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'collectivite_communiquez', menu_level: 2 }),
        },
        text: 'Communiquez sur votre réseau',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants#prospecter',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'collectivite_prospectez', menu_level: 2 }),
        },
        text: 'Trouvez des prospects',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants#developper',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'collectivite_developpez', menu_level: 2 }),
        },
        text: 'Développez votre réseau grâce aux données',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants/potentiel-creation-reseau',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'collectivite_potentiel', menu_level: 2 }),
        },
        text: 'Pas encore de réseau ? Testez votre potentiel',
      },
    ],
    text: 'Collectivités, exploitants',
  },
  // {
  //   text: 'Professionnels',
  //   menuLinks: [
  //     {
  //       text: 'Nos services pour les professionnels',
  //       linkProps: {
  //         href: '/professionnels',
  //       },
  //     },
  //     {
  //       text: 'Les avantages du chauffage urbain',
  //       linkProps: {
  //         href: '/professionnels#avantages-du-chauffage-urbain',
  //       },
  //     },
  //     {
  //       text: 'Testez une liste d’adresses',
  //       linkProps: {
  //         href: '/professionnels#test-liste',
  //       },
  //     },
  //     {
  //       text: 'Les coûts du chauffage urbain',
  //       linkProps: {
  //         href: '/professionnels#simulateur-aide',
  //       },
  //     },
  //     {
  //       text: 'Le décret tertiaire',
  //       linkProps: {
  //         href: '/professionnels#decrettertiaire',
  //       },
  //     },
  //     {
  //       text: 'Les obligations de raccordement',
  //       linkProps: {
  //         href: '/professionnels#obligations-de-raccordement',
  //       },
  //     },
  //     {
  //       text: 'Simulateur d’émissions de CO2',
  //       linkProps: {
  //         href: '/professionnels#simulateur-co2',
  //       },
  //     },
  //   ],
  // },
  {
    menuLinks: [
      {
        linkProps: {
          href: '/qui-sommes-nous',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'qui_sommes_nous', menu_level: 2 }),
        },
        text: 'Qui sommes-nous ?',
      },
      {
        linkProps: {
          href: '/faq',
          onClick: () => trackPostHogEvent('faq:click', { source: 'menu' }),
        },
        text: 'FAQ',
      },
      {
        linkProps: {
          href: '/contact',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'contact', menu_level: 2 }),
        },
        text: 'Nous contacter',
      },
      {
        linkProps: {
          href: '/stats',
          onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'stats', menu_level: 2 }),
        },
        text: 'Nos statistiques',
      },
    ],
    text: 'Notre service',
  },
];

const authenticatedNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'pro_accueil', menu_level: 1 }),
    },
    text: 'Retour au site',
  },
];

const professionnelNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/pro/tableau-de-bord',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'pro_dashboard', menu_level: 1 }),
    },
    text: 'Tableau de bord',
  },
  {
    linkProps: {
      href: '/pro/mes-demandes',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'pro_demandes', menu_level: 1 }),
    },
    text: 'Mes demandes',
  },
  {
    linkProps: {
      href: '/pro/comparateur-couts-performances',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'pro_comparateur', menu_level: 1 }),
    },
    text: 'Comparateur de coûts et CO2',
  },
  {
    linkProps: {
      href: '/pro/tests-adresses',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'pro_test_adresses', menu_level: 1 }),
    },
    text: "Test d'adresses",
  },
];

const gestionnaireNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/pro/demandes',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'gestionnaire_demandes', menu_level: 1 }),
    },
    text: 'Demandes',
  },
  {
    linkProps: {
      href: '/pro/comparateur-couts-performances',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'gestionnaire_comparateur', menu_level: 1 }),
    },
    text: 'Comparateur de coûts et CO2',
  },
  {
    linkProps: {
      href: '/pro/tests-adresses',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'gestionnaire_test_adresse', menu_level: 1 }),
    },
    text: "Test d'adresses",
  },
  {
    linkProps: {
      href: '/pro/aide',
      onClick: () => trackPostHogEvent('nav:menu_item_clicked', { item: 'gestionnaire_aide', menu_level: 1 }),
    },
    text: 'Aide',
  },
];

const adminNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/pro/tableau-de-bord',
    },
    text: 'Tableau de bord',
  },
  {
    linkProps: {
      href: '/pro/comparateur-couts-performances',
    },
    text: 'Comparateur de coûts et CO2',
  },
  {
    linkProps: {
      href: '/pro/tests-adresses',
    },
    text: "Test d'adresses",
  },
  {
    megaMenu: {
      categories: adminPageGroups.map(({ id, label }) => ({
        categoryMainText: label,
        links: adminPages
          .filter((page) => page.group === id)
          .map((page) => ({
            linkProps: {
              href: page.href,
            },
            text: page.label,
          })),
      })),
    },
    text: 'Administration',
  },
];

function markCurrentPageActive(menuItems: MainNavigationProps.Item[], currentUrl: string): MainNavigationProps.Item[] {
  return menuItems.map((item) => {
    if (item.megaMenu) {
      const categories = item.megaMenu.categories.map((category) => ({
        ...category,
        links: category.links.map((link) => ({
          ...link,
          isActive: link.linkProps.href === currentUrl,
        })),
      }));
      return {
        ...item,
        isActive: categories.some((category) => category.links.some((link) => link.isActive)),
        megaMenu: { ...item.megaMenu, categories },
      };
    }

    if (item.menuLinks) {
      const subMenu = markCurrentPageActive(item.menuLinks, currentUrl) as MainNavigationProps.Item.Link[];
      return {
        ...item,
        isActive: subMenu.some((child) => child.isActive),
        menuLinks: subMenu,
      };
    }

    return {
      ...item,
      isActive: item.linkProps?.href === currentUrl,
    };
  });
}

interface PageHeaderProps {
  mode: PageMode;
  currentPage?: string;
}

/**
 * The navbar and toolbar are hidden automatically when <= 992px by the DSFR component because they are moved in
 * a modal, behind a hamburger menu.
 *
 * When in fullscreen:
 * - the first line is hidden automatically when >= 992px, and is displayed otherwise because the hamburger menu appears
 * - the service (title and description) is hidden (useful when < 992px)
 * - the second line takes more elements:
 *   - a logo at the left
 *   - tool links at the right
 */
const PageHeader = (props: PageHeaderProps) => {
  const router = useRouter();
  const isRouterReady = useRouterReady();
  const { session, hasRole, signOut, isAuthenticated } = useAuthentication();

  // Use state to track authentication status after hydration to avoid hydration mismatch
  const [isAuthenticatedClient, setIsAuthenticatedClient] = useState(false);

  useEffect(() => {
    setIsAuthenticatedClient(isAuthenticated);
  }, [isAuthenticated]);

  const isFullScreenMode = props.mode === 'public-fullscreen' || props.mode === 'authenticated';

  // Compute navigation menu based on user role (useMemo to avoid infinite loops with hasRole function reference)
  const navigationMenuItems = useMemo<MainNavigationProps.Item[]>(() => {
    if (props.mode === 'authenticated') {
      return [
        ...authenticatedNavigationMenu,
        ...(hasRole('admin') ? adminNavigationMenu : []),
        ...(hasRole('gestionnaire') || hasRole('collectivite') || hasRole('alec') || hasRole('ccrt') ? gestionnaireNavigationMenu : []),
        ...(hasRole('particulier') || hasRole('professionnel') ? professionnelNavigationMenu : []),
      ];
    }
    return publicNavigationMenu;
  }, [props.mode, session?.user?.role]);

  // Use useRouterReady hook to ensure stable path during hydration
  // Always use empty string on server to prevent hydration mismatch
  const currentPath = props.currentPage ?? (typeof window !== 'undefined' && isRouterReady ? router.pathname : '');

  const quickAccessItems =
    props.mode === 'authenticated'
      ? ([
          ...(session?.impersonating
            ? [
                {
                  buttonProps: {
                    onClick: async () => {
                      await deleteFetchJSON('/api/admin/impersonate');
                      location.href = '/admin/impostures';
                    },
                    style: {
                      backgroundColor: 'var(--background-flat-error)',
                      borderRadius: '6px',
                      color: 'white',
                    },
                  },
                  iconId: 'fr-icon-logout-box-r-line',
                  text: 'Imposture en cours',
                } satisfies HeaderProps.QuickAccessItem,
              ]
            : []),
          {
            iconId: 'fr-icon-account-circle-line',
            linkProps: {
              href: '/pro/mon-compte',
            },
            text: 'Mon compte',
          },
          {
            buttonProps: {
              onClick: () => signOut({ callbackUrl: '/' }),
            },
            iconId: 'fr-icon-logout-box-r-line',
            text: 'Se déconnecter',
          },
        ] satisfies HeaderProps.QuickAccessItem[])
      : [
          {
            iconId: isAuthenticatedClient ? 'fr-icon-account-circle-fill' : 'fr-icon-account-circle-line',
            linkProps: {
              href: '/connexion',
              onClick: () => trackPostHogEvent('global:login_cta_clicked', { is_auth: isAuthenticatedClient }),
            },
            text: isAuthenticatedClient ? 'Espace connecté' : 'Connectez-vous',
          } satisfies HeaderProps.QuickAccessItem,
        ];

  return (
    <StyledHeader
      id="main-header"
      disableDisplay
      $isFullScreenMode={isFullScreenMode}
      brandTop={
        <>
          République
          <br />
          Française
        </>
      }
      homeLinkProps={{
        href: '/',
        title: "Revenir à l'accueil",
      }}
      operatorLogo={{
        alt: 'Logo France Chaleur Urbaine',
        imgUrl: '/FCU_logo_Monogramme.svg',
        orientation: 'horizontal',
      }}
      serviceTagline="Faciliter les raccordements aux réseaux de chaleur"
      serviceTitle="France Chaleur Urbaine"
      quickAccessItems={quickAccessItems}
      navigation={
        isFullScreenMode ? (
          <Box display="flex">
            <Link
              href="/"
              className="fcu-navigation-logo min-w-12 max-w-20"
              variant="tertiaryNoOutline"
              title="Revenir à la page d'accueil"
              p="0"
              mr="3w"
            >
              <Image height={50} width={70} src="/logo-fcu.png" alt="Logo France Chaleur Urbaine" priority />
            </Link>
            <MainNavigation items={markCurrentPageActive(navigationMenuItems, currentPath)} className="fr-col" $compact />
            <Box className={fr.cx('fr-header__tools-links')}>
              <ul className={fr.cx('fr-btns-group', 'fr-col--middle')}>
                {quickAccessItems.map((quickAccessItem, index) => (
                  <li key={index}>
                    <HeaderQuickAccessItem quickAccessItem={quickAccessItem} />
                  </li>
                ))}
              </ul>
            </Box>
          </Box>
        ) : (
          markCurrentPageActive(navigationMenuItems, currentPath)
        )
      }
    />
  );
};

const PageFooter = () => (
  <Footer
    id="main-footer"
    contentDescription={
      <>
        France Chaleur Urbaine est un projet d'innovation pour accélérer le raccordement des bâtiments aux réseaux de chaleur en vue de
        l'atteinte des objectifs de développement de la chaleur d'origine renouvelable.
        <br />
        <br />
        <span className="font-bold">
          Faites nous part de vos propositions pour améliorer ce service via notre&nbsp;<Link href="/contact">formulaire de contact</Link>.
        </span>
      </>
    }
    domains={[]}
    operatorLogo={{
      alt: 'ADEME',
      imgUrl: '/logo-ADEME.svg',
      orientation: 'horizontal',
    }}
    homeLinkProps={{
      className: '[&_img]:!h-[120px] [&_img]:!max-h-[120px]', // agrandit et surcharge le style DSFR qui limite la hauteur
      href: 'https://ademe.fr',
      title: 'ADEME',
    }}
    license=""
    accessibility="non compliant"
    accessibilityLinkProps={{
      href: '/accessibilite',
      onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'accessibilite' }),
    }}
    termsLinkProps={{
      href: '/mentions-legales',
    }}
    bottomItems={[
      {
        linkProps: {
          href: '/cgu',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'cgu' }),
        },
        text: 'CGU',
      },
      {
        linkProps: {
          href: '/donnees',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'donnees' }),
        },
        text: 'Données et sources',
      },
      {
        linkProps: {
          href: '/politique-de-confidentialite',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'politique_de_confidentialite' }),
        },
        text: 'Données personnelles',
      },
      <FooterConsentManagementItem key="consent-management" />,
      {
        linkProps: {
          href: '/stats',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'stat' }),
        },
        text: 'Statistiques',
      },
      {
        linkProps: {
          href: '/faq',
          onClick: () => trackPostHogEvent('faq:click', { source: 'footer' }),
        },
        text: 'FAQ',
      },
      {
        linkProps: {
          href: '/contact',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'contact' }),
        },
        text: 'Contact',
      },
      {
        linkProps: {
          href: '/plan-du-site',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'plan_du_site' }),
        },
        text: 'Plan du site',
      },
      {
        iconId: 'fr-icon-github-fill',
        linkProps: {
          href: 'https://github.com/betagouv/france-chaleur-urbaine',
          onClick: () => trackPostHogEvent('global:footer_link_clicked', { link_name: 'github' }),
        },
        text: 'Code source',
      },
    ]}
  />
);
