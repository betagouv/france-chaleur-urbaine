import { fr } from '@codegouvfr/react-dsfr';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { type HeaderProps, HeaderQuickAccessItem } from '@codegouvfr/react-dsfr/Header';
import UnstyledMainNavigation, { type MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { useRouter } from 'next/router';
import React from 'react';
import styled, { css } from 'styled-components';

import { clientConfig } from '@/client-config';
import { FooterConsentManagementItem } from '@/components/ConsentBanner';
import SEO, { type SEOProps } from '@/components/SEO';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
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
  layout?: 'center' | 'fluid';
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
          { label: 'Contenu', anchor: '#main-content' },
          { label: 'Navigation', anchor: '#main-header' },
          { label: 'Pied de page', anchor: '#main-footer' },
        ]}
      />
      <PageHeader mode={mode ?? 'public'} currentPage={currentPage} />

      <main id="main-content" className={cx(layout === 'center' ? 'fr-container fr-my-2w' : '', className)}>
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
    text: 'Accueil',
    linkProps: {
      href: '/',
    },
  },
  {
    text: 'Combien ça coûte ?',
    linkProps: {
      href: '/comparateur-couts-performances',
    },
  },
  {
    text: 'Carte des réseaux',
    linkProps: {
      href: '/carte',
    },
  },

  {
    text: 'Ressources et outils',
    menuLinks: [
      {
        text: 'Liste des réseaux de chaleur',
        linkProps: {
          href: '/reseaux',
        },
      },
      {
        text: 'Actualités',
        linkProps: {
          href: '/actus',
        },
      },
      {
        text: 'Articles sur le chauffage urbain',
        linkProps: {
          href: '/ressources/articles',
        },
      },
      {
        text: 'Supports pédagogiques',
        linkProps: {
          href: '/ressources/supports',
        },
      },
      {
        text: 'Actions de communication',
        linkProps: {
          href: '/ressources/actions-de-communication',
        },
      },
      {
        text: 'Nos replays et présentations',
        linkProps: {
          href: '/webinaires',
        },
      },
      {
        text: 'Outils',
        linkProps: {
          href: '/ressources/outils',
        },
      },
    ],
  },

  {
    text: 'Collectivités, exploitants',
    menuLinks: [
      {
        text: 'France Chaleur Urbaine à votre service',
        linkProps: {
          href: '/collectivites-et-exploitants',
        },
      },
      {
        text: 'Communiquez sur votre réseau',
        linkProps: {
          href: '/collectivites-et-exploitants#communiquer',
        },
      },
      {
        text: 'Trouvez des prospects',
        linkProps: {
          href: '/collectivites-et-exploitants#prospecter',
        },
      },
      {
        text: 'Développez votre réseau grâce aux données',
        linkProps: {
          href: '/collectivites-et-exploitants#developper',
        },
      },
      {
        text: 'Pas encore de réseau ? Testez votre potentiel',
        linkProps: {
          href: '/collectivites-et-exploitants/potentiel-creation-reseau',
        },
      },
    ],
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
    text: 'Notre service',
    menuLinks: [
      {
        text: 'Qui sommes-nous ?',
        linkProps: {
          href: '/qui-sommes-nous',
        },
      },
      {
        text: 'Nous contacter',
        linkProps: {
          href: '/contact',
        },
      },
      {
        text: 'Nos statistiques',
        linkProps: {
          href: '/stats',
        },
      },
    ],
  },
];

const authenticatedNavigationMenu: MainNavigationProps.Item[] = [
  {
    text: 'Retour au site',
    linkProps: {
      href: '/',
    },
  },
];

const professionnelNavigationMenu: MainNavigationProps.Item[] = [
  {
    text: 'Tableau de bord',
    linkProps: {
      href: '/pro/tableau-de-bord',
    },
  },
  {
    text: 'Comparateur de coûts et CO2',
    linkProps: {
      href: '/pro/comparateur-couts-performances',
    },
  },
  {
    text: "Test d'adresses",
    linkProps: {
      href: '/pro/tests-adresses',
    },
  },
];

const gestionnaireNavigationMenu: MainNavigationProps.Item[] = [
  {
    text: 'Demandes',
    linkProps: {
      href: '/pro/demandes',
    },
  },
  {
    text: 'Comparateur de coûts et CO2',
    linkProps: {
      href: '/pro/comparateur-couts-performances',
    },
  },
  {
    text: "Test d'adresses",
    linkProps: {
      href: '/pro/tests-adresses',
    },
  },
  {
    text: 'Aide',
    linkProps: {
      href: '/pro/aide',
    },
  },
];

const adminNavigationMenu: MainNavigationProps.Item[] = [
  {
    text: 'Tableau de bord',
    linkProps: {
      href: '/pro/tableau-de-bord',
    },
  },
  {
    text: 'Comparateur de coûts et CO2',
    linkProps: {
      href: '/pro/comparateur-couts-performances',
    },
  },
  {
    text: "Test d'adresses",
    linkProps: {
      href: '/pro/tests-adresses',
    },
  },
  {
    text: 'Administration',
    menuLinks: [
      {
        text: 'Activité du site',
        linkProps: {
          href: '/admin/events',
        },
      },
      {
        text: 'Gestion des utilisateurs',
        linkProps: {
          href: '/admin/users',
        },
      },
      {
        text: 'Gestion des demandes',
        linkProps: {
          href: '/admin/demandes',
        },
      },
      {
        text: 'Gestion des tags gestionnaires',
        linkProps: {
          href: '/admin/tags',
        },
      },
      {
        text: "Gestion des règles d'affectation",
        linkProps: {
          href: '/admin/assignment-rules',
        },
      },
      {
        text: 'Gestion des réseaux',
        linkProps: {
          href: '/admin/reseaux',
        },
      },
      {
        text: 'Suivi des tâches',
        linkProps: {
          href: '/admin/jobs',
        },
      },
      {
        text: "Tests d'adresses",
        linkProps: {
          href: '/admin/tests-adresses',
        },
      },
      {
        text: 'Impostures',
        linkProps: {
          href: '/admin/impostures',
        },
      },
      {
        text: 'Test de coordonnées géographiques',
        linkProps: {
          href: '/admin/test-coordonnees-geographiques',
        },
      },
      {
        text: 'Diagnostic',
        linkProps: {
          href: '/admin/diagnostic',
        },
      },
    ],
  },
];

function markCurrentPageActive(menuItems: MainNavigationProps.Item[], currentUrl: string): MainNavigationProps.Item[] {
  return menuItems.map((item) => {
    const subMenu = markCurrentPageActive(item.menuLinks ?? [], currentUrl) as MainNavigationProps.Item.Link[];

    const subMenuItemActive = subMenu.some((child) => child.isActive);

    if (item.menuLinks) {
      return {
        ...item,
        menuLinks: subMenu,
        isActive: subMenuItemActive,
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
  const { session, hasRole, signOut, isAuthenticated } = useAuthentication();

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

  // Use router.isReady to ensure stable path during hydration
  const currentPath = props.currentPage ?? (router.isReady ? router.pathname : '');

  const quickAccessItems =
    props.mode === 'authenticated'
      ? ([
          ...(session?.impersonating
            ? [
                {
                  text: 'Imposture en cours',
                  iconId: 'fr-icon-logout-box-r-line',
                  buttonProps: {
                    onClick: async () => {
                      await deleteFetchJSON('/api/admin/impersonate');
                      location.href = '/admin/impostures';
                    },
                    style: {
                      color: 'white',
                      backgroundColor: 'var(--background-flat-error)',
                      borderRadius: '6px',
                    },
                  },
                } satisfies HeaderProps.QuickAccessItem,
              ]
            : []),
          {
            text: 'Se déconnecter',
            iconId: 'fr-icon-logout-box-r-line',
            buttonProps: {
              onClick: () => signOut({ callbackUrl: '/' }),
            },
          },
        ] satisfies HeaderProps.QuickAccessItem[])
      : [
          {
            text: isAuthenticated ? 'Espace connecté' : 'Connectez-vous',
            iconId: isAuthenticated ? 'fr-icon-account-circle-fill' : 'fr-icon-account-circle-line',
            linkProps: {
              href: '/connexion',
            },
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
          imgUrl: '/FCU_logo_Monogramme.svg',
          orientation: 'horizontal',
          alt: 'Logo France Chaleur Urbaine',
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
      imgUrl: '/logo-fcu-with-typo.jpg',
      orientation: 'horizontal',
      alt: 'Logo France Chaleur Urbaine',
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
        text: 'CGU',
        linkProps: {
          href: '/cgu',
        },
      },
      {
        text: 'Données personnelles',
        linkProps: {
          href: '/politique-de-confidentialite',
        },
      },
      <FooterConsentManagementItem key="consent-management" />,
      {
        text: 'Statistiques',
        linkProps: {
          href: '/stats',
        },
      },
      {
        text: 'Contact',
        linkProps: {
          href: '/contact',
        },
      },
      {
        text: 'Plan du site',
        linkProps: {
          href: '/plan-du-site',
        },
      },
      {
        text: 'Code source',
        iconId: 'fr-icon-github-fill',
        linkProps: {
          href: 'https://github.com/betagouv/france-chaleur-urbaine',
        },
      },
    ]}
  />
);
