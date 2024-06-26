import {
  FooterBody,
  FooterBodyItem,
  FooterBottom,
  FooterCopy,
  Footer as FooterDS,
  FooterLink,
  FooterOperator,
  FooterPartners,
  FooterPartnersLogo,
  FooterPartnersSecondaryTitle,
  FooterPartnersTitle,
  Header,
  HeaderBody,
  HeaderNav,
  HeaderOperator,
  Logo,
  NavItem,
  NavSubItem,
  Service,
  Tool,
  ToolItem,
  ToolItemGroup,
} from '@dataesr/react-dsfr';
import { deleteFetchJSON } from '@utils/network';
import { signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ComponentProps, Fragment } from 'react';
import { USER_ROLE } from 'src/types/enum/UserRole';
import {
  FullScreenItems,
  FullScreenModeFirstLine,
  FullScreenModeNavLogo,
  StopImpersonationButton,
} from './SimplePage.styles';

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

type NavigationItem = {
  title: string;
  href?: string;
  children?: NavigationItem[];
};

const publicNavigationMenu: NavigationItem[] = [
  {
    title: 'Copropriétaires',
    children: [
      {
        title: 'Testez votre adresse',
        href: '/',
      },
      {
        title: 'Comprendre le chauffage urbain',
        href: '/#comprendre-le-chauffage-urbain',
      },
      {
        title: 'Les avantages du chauffage urbain',
        href: '/#avantages-du-chauffage-urbain',
      },
      {
        title: 'Les coûts du chauffage urbain',
        href: '/#couts-du-chauffage-urbain',
      },
      {
        title: 'Les obligations de raccordement',
        href: '/#obligations-de-raccordement',
      },
      {
        title: 'Comment se raccorder ?',
        href: '/#comment-se-raccorder',
      },
    ],
  },
  {
    title: 'Professionnels',
    children: [
      {
        title: 'Nos services pour les professionnels',
        href: '/professionnels',
      },
      {
        title: 'Les avantages du chauffage urbain',
        href: '/professionnels#avantages-du-chauffage-urbain',
      },
      {
        title: 'Testez une liste d’adresses',
        href: '/professionnels#test-liste',
      },
      {
        title: 'Les coûts du chauffage urbain',
        href: '/professionnels#simulateur-aide',
      },
      {
        title: 'Le décret tertiaire',
        href: '/professionnels#decrettertiaire',
      },
      {
        title: 'Les obligations de raccordement',
        href: '/professionnels#obligations-de-raccordement',
      },
      {
        title: 'Simulateur d’émissions de CO2',
        href: '/professionnels#simulateur-co2',
      },
    ],
  },
  {
    title: 'Collectivités, exploitants',
    children: [
      {
        title: 'France Chaleur Urbaine à votre service',
        href: '/collectivites-et-exploitants',
      },
      {
        title: 'Communiquez sur votre réseau',
        href: '/collectivites-et-exploitants#communiquer',
      },
      {
        title: 'Trouvez des prospects',
        href: '/collectivites-et-exploitants#prospecter',
      },
      {
        title: 'Développez votre réseau grâce aux données',
        href: '/collectivites-et-exploitants#developper',
      },
    ],
  },
  {
    title: 'Cartographie',
    href: '/carte',
  },
  {
    title: 'Ressources',
    href: '/ressources',
    children: [
      {
        title: 'Nos actualités',
        href: '/actus',
      },
      {
        title: 'Nos articles sur le chauffage urbain',
        href: '/ressources/articles',
      },
      {
        title: 'Nos supports pédagogiques',
        href: '/ressources/supports',
      },
      {
        title: 'Nos actions de communication',
        href: '/ressources/actions-de-communication',
      },
      {
        title: 'Nos outils',
        href: '/ressources/outils',
      },
    ],
  },
  {
    title: 'Notre service',
    children: [
      {
        title: 'Qui sommes-nous ?',
        href: '/qui-sommes-nous',
      },
      {
        title: 'Nous contacter',
        href: '/contact',
      },
    ],
  },
];

const authenticatedNavigationMenu: NavigationItem[] = [
  {
    title: 'Retour au site',
    href: '/',
  },
  {
    title: 'Tableau de bord',
    href: '/gestionnaire',
  },
  {
    title: 'Aide',
    href: '/aide',
  },
];

const adminNavigationMenu: NavigationItem[] = [
  {
    title: 'Administration',
    href: '/admin',
  },
];

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

  const isFullScreenMode =
    props.mode === 'public-fullscreen' || props.mode === 'authenticated';

  const FirstLineContainer = isFullScreenMode
    ? FullScreenModeFirstLine
    : Fragment;

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
    <Header>
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

          {/* beware: do not try to merge these two blocs! */}
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
            {/* ici warning Prop `aria-controls` did not match lié à @dataesr/react-dsfr */}
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
            {/* beware: do not try to simplify these blocs as @dataesr/react-dsfr won't let you use fragments! */}
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
    </Header>
  );
};

const footerDescription = `France Chaleur Urbaine est un projet d'innovation pour accélérer
  le raccordement des bâtiments aux réseaux de chaleur en vue de
  l'atteinte des objectifs de développement de la chaleur
  d'origine renouvelable.`;

const PageFooter = () => {
  return (
    <FooterDS>
      <FooterBody description={footerDescription}>
        <Logo
          splitCharacter={10}
          asLink={<Link href="/" title="Revenir à l'accueil" />}
        >
          République Française
        </Logo>
        <FooterOperator>
          <Image
            height={136}
            width={242}
            src="/logo-fcu-with-typo.jpg"
            alt="logo france chaleur urbaine"
          />
        </FooterOperator>
        <FooterBodyItem>
          Faites nous part de vos propositions pour améliorer ce service :
          <br />
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
            france-chaleur-urbaine@developpement-durable.gouv.fr
          </a>
        </FooterBodyItem>
      </FooterBody>
      <FooterPartners>
        <FooterPartnersTitle>A l'origine du projet</FooterPartnersTitle>
        <FooterPartnersSecondaryTitle>
          Nos financeurs
        </FooterPartnersSecondaryTitle>
        <LazyFooterPartnersLogo
          isMain
          href="http://www.driee.ile-de-france.developpement-durable.gouv.fr/"
          imageSrc="/logo-DRIEAT.png"
          target="_blank"
          imageAlt="DRIEAT"
        />
        <LazyFooterPartnersLogo
          href="https://www.gouvernement.fr/"
          imageSrc="/logo-government.svg"
          target="_blank"
          imageAlt="Gouvernement"
        />
        <LazyFooterPartnersLogo
          href="https://www.ademe.fr"
          imageSrc="/logo-ADEME.svg"
          target="_blank"
          imageAlt="ADEME"
        />
      </FooterPartners>
      <FooterBottom>
        <FooterLink
          asLink={
            <Link href="/accessibilite" className="fr-footer__bottom-link">
              Accessibilité: non conforme
            </Link>
          }
        />
        <FooterLink
          asLink={
            <Link href="/mentions-legales" className="fr-footer__bottom-link">
              Mentions légales & CGU
            </Link>
          }
        />
        <FooterLink href="/#consentement">
          Cookies &amp; Consentements
        </FooterLink>
        <FooterLink
          asLink={
            <Link
              href="/politique-de-confidentialite"
              className="fr-footer__bottom-link"
            >
              Données personnelles
            </Link>
          }
        />
        <FooterLink
          asLink={
            <Link href="/stats" className="fr-footer__bottom-link">
              Statistiques
            </Link>
          }
        />
        <FooterLink
          asLink={
            <Link href="/contact" className="fr-footer__bottom-link">
              Contact
            </Link>
          }
        />
        <FooterLink
          target="_blank"
          href="https://github.com/betagouv/france-chaleur-urbaine"
        >
          <Image
            src="/icons/github-brands.svg"
            width={12}
            height={12}
            alt=""
            aria-hidden
          />{' '}
          Github
        </FooterLink>
        <FooterCopy>
          Sauf mention contraire, tous les contenus de ce site sont sous{' '}
          <a
            href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
            target="_blank"
            rel="noreferrer"
          >
            licence etalab-2.0
          </a>
        </FooterCopy>
      </FooterBottom>
    </FooterDS>
  );
};

/**
 * Version des logo partenaires qui active le lazy loading.
 */
const LazyFooterPartnersLogo = (
  props: ComponentProps<typeof FooterPartnersLogo> & { href: string }
) => (
  <Link className="fr-footer__partners-link" href={props.href} target="_blank">
    <img
      className="fr-footer__logo"
      src={props.imageSrc}
      alt={props.imageAlt}
      loading="lazy"
    />
  </Link>
);

// Permet au composant FooterPartners de retrouver le logo
LazyFooterPartnersLogo.defaultProps = {
  __TYPE: 'FooterPartnersLogo',
};
