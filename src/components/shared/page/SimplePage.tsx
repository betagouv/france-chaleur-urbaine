import { fr } from '@codegouvfr/react-dsfr';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { type HeaderProps, HeaderQuickAccessItem } from '@codegouvfr/react-dsfr/Header';
import UnstyledMainNavigation, { type MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { useRouter } from 'next/router';
import type React from 'react';
import { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { clientConfig } from '@/client-config';
import { FooterConsentManagementItem } from '@/components/ConsentBanner';
import SEO, { type SEOProps } from '@/components/SEO';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import useRouterReady from '@/hooks/useRouterReady';
import { useAuthentication } from '@/modules/auth/client/hooks';
import cx from '@/utils/cx';
import { deleteFetchJSON } from '@/utils/network';

import Banner from './Banner';
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
    },
    text: 'Accueil',
  },
  {
    linkProps: {
      href: '/comparateur-couts-performances',
    },
    text: 'Combien ça coûte ?',
  },
  {
    linkProps: {
      href: '/carte',
    },
    text: 'Carte des réseaux',
  },

  {
    menuLinks: [
      {
        linkProps: {
          href: '/reseaux',
        },
        text: 'Liste des réseaux de chaleur',
      },
      {
        linkProps: {
          href: '/actus',
        },
        text: 'Actualités',
      },
      {
        linkProps: {
          href: '/ressources/articles',
        },
        text: 'Articles sur le chauffage urbain',
      },
      {
        linkProps: {
          href: '/ressources/supports',
        },
        text: 'Supports pédagogiques',
      },
      {
        linkProps: {
          href: '/ressources/actions-de-communication',
        },
        text: 'Actions de communication',
      },
      {
        linkProps: {
          href: '/webinaires',
        },
        text: 'Nos replays et présentations',
      },
      {
        linkProps: {
          href: '/ressources/outils',
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
        },
        text: 'France Chaleur Urbaine à votre service',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants#communiquer',
        },
        text: 'Communiquez sur votre réseau',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants#prospecter',
        },
        text: 'Trouvez des prospects',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants#developper',
        },
        text: 'Développez votre réseau grâce aux données',
      },
      {
        linkProps: {
          href: '/collectivites-et-exploitants/potentiel-creation-reseau',
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
        },
        text: 'Qui sommes-nous ?',
      },
      {
        linkProps: {
          href: '/contact',
        },
        text: 'Nous contacter',
      },
      {
        linkProps: {
          href: '/stats',
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
    },
    text: 'Retour au site',
  },
];

const professionnelNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/pro/tableau-de-bord',
    },
    text: 'Tableau de bord',
  },
  {
    linkProps: {
      href: '/pro/mes-demandes',
    },
    text: 'Mes demandes',
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
];

const gestionnaireNavigationMenu: MainNavigationProps.Item[] = [
  {
    linkProps: {
      href: '/pro/demandes',
    },
    text: 'Demandes',
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
    linkProps: {
      href: '/pro/aide',
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
    menuLinks: [
      {
        linkProps: {
          href: '/admin/events',
        },
        text: 'Activité du site',
      },
      {
        linkProps: {
          href: '/admin/users',
        },
        text: 'Gestion des utilisateurs',
      },
      {
        linkProps: {
          href: '/admin/demandes',
        },
        text: 'Gestion des demandes',
      },
      {
        linkProps: {
          href: '/admin/reseaux-demandes-stats',
        },
        text: 'Suivi réseaux et demandes',
      },
      {
        linkProps: {
          href: '/admin/tags',
        },
        text: 'Gestion des tags gestionnaires',
      },
      {
        linkProps: {
          href: '/admin/tags-stats',
        },
        text: 'Statistiques par tag',
      },
      {
        linkProps: {
          href: '/admin/assignment-rules',
        },
        text: "Gestion des règles d'affectation",
      },
      {
        linkProps: {
          href: '/admin/reseaux',
        },
        text: 'Gestion des réseaux',
      },
      {
        linkProps: {
          href: '/admin/jobs',
        },
        text: 'Suivi des tâches',
      },
      {
        linkProps: {
          href: '/admin/tests-adresses',
        },
        text: "Tests d'adresses",
      },
      {
        linkProps: {
          href: '/admin/impostures',
        },
        text: 'Impostures',
      },
      {
        linkProps: {
          href: '/admin/diagnostic',
        },
        text: 'Diagnostic',
      },
    ],
    text: 'Administration',
  },
];

function markCurrentPageActive(menuItems: MainNavigationProps.Item[], currentUrl: string): MainNavigationProps.Item[] {
  return menuItems.map((item) => {
    const subMenu = markCurrentPageActive(item.menuLinks ?? [], currentUrl) as MainNavigationProps.Item.Link[];

    const subMenuItemActive = subMenu.some((child) => child.isActive);

    if (item.menuLinks) {
      return {
        ...item,
        isActive: subMenuItemActive,
        menuLinks: subMenu,
      };
    }
    return {
      ...item,
      isActive: item.linkProps?.href === currentUrl || subMenuItemActive,
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

  const navigationMenuItems =
    props.mode === 'authenticated'
      ? [
          ...authenticatedNavigationMenu,
          ...(hasRole('admin') ? adminNavigationMenu : []),
          ...(hasRole('gestionnaire') || hasRole('demo') ? gestionnaireNavigationMenu : []),
          ...(hasRole('particulier') || hasRole('professionnel') ? professionnelNavigationMenu : []),
        ]
      : publicNavigationMenu;

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
            },
            text: isAuthenticatedClient ? 'Espace connecté' : 'Connectez-vous',
          } satisfies HeaderProps.QuickAccessItem,
        ];

  return (
    <>
      <Banner />
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
    </>
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
        <Text as="span" fontWeight="bold">
          Faites nous part de vos propositions pour améliorer ce service&nbsp;:
        </Text>
        <br />
        <Text as="span" fontWeight="bold">
          <a href={`mailto:${clientConfig.contactEmail}`}>{clientConfig.contactEmail}</a>
        </Text>
      </>
    }
    domains={[]}
    operatorLogo={{
      alt: 'Logo France Chaleur Urbaine',
      imgUrl: '/logo-fcu-with-typo.jpg',
      orientation: 'horizontal',
    }}
    license=""
    partnersLogos={{
      main: {
        alt: 'DRIEAT',
        imgUrl: '/logo-DRIEAT-white.png',
        linkProps: {
          href: 'https://www.drieat.ile-de-france.developpement-durable.gouv.fr',
          title: 'Lien vers le site du partenaire',
        },
      },
      sub: [
        {
          alt: 'Gouvernement',
          imgUrl: '/logo-government.svg',
          linkProps: {
            href: 'https://www.gouvernement.fr/',
            title: 'Lien vers le site du partenaire',
          },
        },
        {
          alt: 'ADEME',
          imgUrl: '/logo-ADEME.svg',
          linkProps: {
            href: 'https://www.ademe.fr/',
            title: 'Lien vers le site du partenaire',
          },
        },
      ],
    }}
    accessibility="non compliant"
    accessibilityLinkProps={{
      href: '/accessibilite',
    }}
    termsLinkProps={{
      href: '/mentions-legales',
    }}
    bottomItems={[
      {
        linkProps: {
          href: '/cgu',
        },
        text: 'CGU',
      },
      {
        linkProps: {
          href: '/politique-de-confidentialite',
        },
        text: 'Données personnelles',
      },
      <FooterConsentManagementItem key="consent-management" />,
      {
        linkProps: {
          href: '/stats',
        },
        text: 'Statistiques',
      },
      {
        linkProps: {
          href: '/contact',
        },
        text: 'Contact',
      },
      {
        linkProps: {
          href: '/plan-du-site',
        },
        text: 'Plan du site',
      },
      {
        iconId: 'fr-icon-github-fill',
        linkProps: {
          href: 'https://github.com/betagouv/france-chaleur-urbaine',
        },
        text: 'Code source',
      },
    ]}
  />
);
