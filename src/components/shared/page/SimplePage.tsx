import Head from 'next/head';
import {
  HeaderBody,
  Header,
  HeaderNav,
  HeaderOperator,
  Logo,
  NavItem,
  Service,
  Tool,
  ToolItem,
  ToolItemGroup,
  NavSubItem,
} from '@dataesr/react-dsfr';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Fragment } from 'react';
import { USER_ROLE } from 'src/types/enum/UserRole';
import Image from 'next/image';
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
} from '@dataesr/react-dsfr';
import { useRouter } from 'next/router';
import {
  FullScreenItems,
  FullScreenModeFirstLine,
  FullScreenModeNavLogo,
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
        title: 'Tester votre adresse',
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
        title: 'Comment se raccorder ?',
        href: '/#comment-se-raccorder',
      },
      {
        title: 'Les coûts du chauffage urbain',
        href: '/#couts-du-chauffage-urbain',
      },
      {
        title: 'Les obligations de raccordement',
        href: '/#obligations-de-raccordement',
      },
    ],
  },
  {
    title: 'Professionnels',
    href: '/professionnels',
  },
  {
    title: 'Collectivités, exploitants',
    href: '/collectivites-et-exploitants',
  },
  {
    title: 'Cartographie',
    href: '/carte',
  },
  {
    title: 'Aller plus loin',
    href: '/ressources',
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
        {/* potentiellement utiliser un préfixe et asPath */}

        {isFullScreenMode && (
          <FullScreenItems>
            <Tool>
              <ToolItemGroup>
                {props.mode === 'authenticated' ? (
                  <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
                    Se déconnecter
                  </ToolItem>
                ) : (
                  <ToolItem
                    asLink={<Link href="/connexion" className="fr-link" />}
                  >
                    Espace gestionnaire
                  </ToolItem>
                )}
              </ToolItemGroup>
            </Tool>
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
        <FooterPartnersLogo
          isMain
          href="http://www.driee.ile-de-france.developpement-durable.gouv.fr/"
          imageSrc="/logo-DRIEAT.png"
          target="_blank"
          imageAlt="DRIEAT"
        />
        <FooterPartnersLogo
          href="https://www.gouvernement.fr/"
          imageSrc="/logo-government.svg"
          target="_blank"
          imageAlt="Gouvernement"
        />
        <FooterPartnersLogo
          href="https://www.ademe.fr"
          imageSrc="/logo-ADEME.svg"
          target="_blank"
          imageAlt="Gouvernement"
        />
        <FooterPartnersLogo
          href="https://www.economie.gouv.fr/plan-de-relance"
          imageSrc="/logo-relance.png"
          target="_blank"
          imageAlt="France relance"
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
