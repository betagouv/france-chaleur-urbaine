import Head from 'next/head';
// import {
//   // HeaderBody,
//   // Header,
//   // HeaderNav,
//   // HeaderOperator,
//   // Logo,
//   // NavItem,
//   // Service,
//   // Tool,
//   // ToolItem,
//   // ToolItemGroup,
//   // NavSubItem,
//   // FooterBody,
//   // FooterBodyItem,
//   // FooterBottom,
//   // FooterCopy,
//   // Footer as FooterDS,
//   // FooterLink,
//   // FooterOperator,
//   // FooterPartners,
//   // FooterPartnersLogo,
//   // FooterPartnersSecondaryTitle,
//   // FooterPartnersTitle,
// } from '@codegouvfr/react-dsfr/Header';
import { Header } from '@codegouvfr/react-dsfr/Header';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { useSession } from 'next-auth/react'; //signOut
//import Link from 'next/link';
//import { ComponentProps, Fragment } from 'react';
import { USER_ROLE } from 'src/types/enum/UserRole';
//import Image from 'next/image';
import { useRouter } from 'next/router';
/*import {
  FullScreenItems,
  FullScreenModeFirstLine,
  FullScreenModeNavLogo,
  StopImpersonationButton,
} from './SimplePage.styles';*/
//import { deleteFetchJSON } from '@utils/network';
import { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';

type PageMode = 'public' | 'public-fullscreen' | 'authenticated';

interface SimplePageProps {
  title?: string;
  children: React.ReactNode;
  mode?: PageMode;
  currentPage?: string;
}

const SimplePage = (props: SimplePageProps) => {
  return (
    <>
      {props.title && (
        <Head>
          <title>{props.title}</title>
        </Head>
      )}
      <PageHeader
        mode={props.mode ?? 'public'}
        currentPage={props.currentPage}
      />
      {props.children}
      <PageFooter />
    </>
  );
};

export default SimplePage;

const publicNavigationMenu: MainNavigationProps.Item[] = [
  {
    text: 'Copropriétaires',
    menuLinks: [
      {
        text: 'Testez votre adresse',
        linkProps: {
          href: '/',
        },
      },
      {
        text: 'Comprendre le chauffage urbain',
        linkProps: {
          href: '/#comprendre-le-chauffage-urbain',
        },
      },
      {
        text: 'Les avantages du chauffage urbain',
        linkProps: {
          href: '/#avantages-du-chauffage-urbain',
        },
      },
      {
        text: 'Comment se raccorder ?',
        linkProps: {
          href: '/#comment-se-raccorder',
        },
      },
      {
        text: 'Les coûts du chauffage urbain',
        linkProps: {
          href: '/#couts-du-chauffage-urbain',
        },
      },
      {
        text: 'Les obligations de raccordement',
        linkProps: {
          href: '/#obligations-de-raccordement',
        },
      },
    ],
  },
  {
    text: 'Professionnels',
    menuLinks: [
      {
        text: 'Nos services pour les professionnels',
        linkProps: {
          href: '/professionnels',
        },
      },
      {
        text: 'Les avantages du chauffage urbain',
        linkProps: {
          href: '/professionnels#avantages-du-chauffage-urbain',
        },
      },
      {
        text: 'Testez une liste d’adresses',
        linkProps: {
          href: '/professionnels#test-liste',
        },
      },
      {
        text: 'Les coûts du chauffage urbain',
        linkProps: {
          href: '/professionnels#simulateur-aide',
        },
      },
      {
        text: 'Le décret tertiaire',
        linkProps: {
          href: '/professionnels#decrettertiaire',
        },
      },
      {
        text: 'Les obligations de raccordement',
        linkProps: {
          href: '/professionnels#obligations-de-raccordement',
        },
      },
      {
        text: 'Simulateur d’émissions de CO2',
        linkProps: {
          href: '/professionnels#simulateur-co2',
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
    ],
  },
  {
    text: 'Cartographie',
    linkProps: {
      href: '/carte',
    },
  },
  {
    text: 'Ressources',
    menuLinks: [
      {
        text: 'Nos actualités',
        linkProps: {
          href: '/actus',
        },
      },
      {
        text: 'Nos articles sur le chauffage urbain',
        linkProps: {
          href: '/ressources/articles',
        },
      },
      {
        text: 'Nos supports pédagogiques',
        linkProps: {
          href: '/ressources/supports',
        },
      },
      {
        text: 'Nos actions de communication',
        linkProps: {
          href: '/ressources/actions-de-communication',
        },
      },
      {
        text: 'Nos outils',
        linkProps: {
          href: '/ressources/outils',
        },
      },
    ],
  },
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
  {
    text: 'Tableau de bord',
    linkProps: {
      href: '/gestionnaire',
    },
  },
  {
    text: 'Aide',
    linkProps: {
      href: '/aide',
    },
  },
];

const adminNavigationMenu: MainNavigationProps.Item[] = [
  {
    text: 'Administration',
    linkProps: {
      href: '/admin',
    },
  },
];

function markCurrentPageActive(
  menuItems: MainNavigationProps.Item[],
  currentUrl: string
): MainNavigationProps.Item[] {
  return menuItems.map((item) => {
    const subMenu = markCurrentPageActive(
      item.menuLinks ?? [],
      currentUrl
    ) as MainNavigationProps.Item.Link[];

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
  const { data: session, status } = useSession();

  /*const isFullScreenMode =
    props.mode === 'public-fullscreen' || props.mode === 'authenticated';*/

  /*const FirstLineContainer = isFullScreenMode
    ? FullScreenModeFirstLine
    : Fragment;*/

  const navigationMenuItems =
    props.mode === 'authenticated'
      ? [
          ...authenticatedNavigationMenu,
          ...(status === 'authenticated' &&
          session.user.role === USER_ROLE.ADMIN
            ? adminNavigationMenu
            : []),
        ]
      : publicNavigationMenu;

  const currentPath = props.currentPage ?? router.pathname;

  return (
    <>
      <Header
        id="fr-header-header-with-quick-access-items"
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
          imgUrl: '/logo-fcu.png',
          orientation: 'horizontal',
          alt: '',
        }}
        serviceTagline="Faciliter les raccordements aux réseaux de chaleur"
        serviceTitle="France Chaleur Urbaine"
        quickAccessItems={[
          {
            iconId: 'fr-icon-account-circle-line',
            linkProps: {
              href: '/connexion',
            },
            text: 'Espace gestionnaire',
          },
        ]}
        navigation={markCurrentPageActive(navigationMenuItems, currentPath)}
      />

      {/* <Header>
      <FirstLineContainer>
        <HeaderBody>
          <Logo splitCharacter={10}>République Française</Logo>
          <HeaderOperator>
            <Image
              height={80}
              width={112}
              src="/logo-fcu.png"
              alt="logo france chaleur urbaine"
              priority
            />
          </HeaderOperator>

          {!isFullScreenMode && (
            <Service
              title="France Chaleur Urbaine"
              description="Faciliter les raccordements aux réseaux de chaleur"
              asLink={
                <Link
                  href="/"
                  title="Revenir à l'accueil"
                  className="fr-header__service-title fr-link--md"
                />
              }
            />
          )}
          {!isFullScreenMode && (
            <Tool>
              <ToolItemGroup>
                <ToolItem
                  asLink={<Link href="/connexion" className="fr-link" />}
                >
                  Espace gestionnaire
                </ToolItem>
              </ToolItemGroup>
            </Tool>
          )}
        </HeaderBody>
      </FirstLineContainer>

      <HeaderNav>
        {isFullScreenMode && (
          <FullScreenModeNavLogo>
            <Image
              height={50}
              width={70}
              src="/logo-fcu.png"
              alt="logo france chaleur urbaine"
              priority
            />
          </FullScreenModeNavLogo>
        )}
        {navigationMenuItems.map(({ title, href, children }) => (
          <NavItem
            key={title}
            title={title}
            current={
              href === currentPath ||
              children?.some((subnav) => subnav.href === currentPath)
            }
            asLink={href ? <Link href={href}>{title}</Link> : undefined}
          >
            {children?.map((subNav) => (
              <NavSubItem
                key={subNav.title}
                title={subNav.title}
                link={subNav.href}
                asLink={
                  subNav.href ? (
                    <Link href={subNav.href}>{subNav.title}</Link>
                  ) : undefined
                }
                current={subNav.href === currentPath}
              />
            ))}
          </NavItem>
        ))}

        {isFullScreenMode && (
          <FullScreenItems>
            {props.mode === 'authenticated' ? (
              session?.impersonating ? (
                <Tool>
                  <ToolItemGroup>
                    <StopImpersonationButton
                      icon="ri-logout-box-r-line"
                      onClick={async () => {
                        await deleteFetchJSON('/api/admin/impersonate');
                        location.reload();
                      }}
                    >
                      Imposture en cours
                    </StopImpersonationButton>

                    <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
                      Se déconnecter
                    </ToolItem>
                  </ToolItemGroup>
                </Tool>
              ) : (
                <Tool>
                  <ToolItemGroup>
                    <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
                      Se déconnecter
                    </ToolItem>
                  </ToolItemGroup>
                </Tool>
              )
            ) : (
              <Tool>
                <ToolItemGroup>
                  <ToolItem
                    asLink={<Link href="/connexion" className="fr-link" />}
                  >
                    Espace gestionnaire
                  </ToolItem>
                </ToolItemGroup>
              </Tool>
            )}
          </FullScreenItems>
        )}
      </HeaderNav>
    </Header> */}
    </>
  );
};

const footerDescription = `France Chaleur Urbaine est un projet d'innovation pour accélérer
  le raccordement des bâtiments aux réseaux de chaleur en vue de
  l'atteinte des objectifs de développement de la chaleur
  d'origine renouvelable.`;

const PageFooter = () => (
  <Footer
    contentDescription={footerDescription}
    operatorLogo={{
      imgUrl: '/logo-fcu-with-typo.jpg',
      orientation: 'horizontal',
      alt: '',
    }}
    partnersLogos={{
      main: {
        alt: 'DRIEAT',
        imgUrl: '/logo-DRIEAT.png',
        linkProps: {
          href: 'http://www.driee.ile-de-france.developpement-durable.gouv.fr/',
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
        text: 'Cookies & Consentements',
        linkProps: {
          href: '/#consentement',
        },
      },
      {
        text: 'Données personnelles',
        linkProps: {
          href: '/politique-de-confidentialite',
        },
      },
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
        text: 'Code source',
        // iconId: 'ri-github-line', // FIXME l'icone crée un souligné moche au survol
        linkProps: {
          href: 'https://github.com/betagouv/france-chaleur-urbaine',
        },
      },
    ]}
  />
);
