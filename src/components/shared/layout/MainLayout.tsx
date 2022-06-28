import {
  Footer,
  FooterBody,
  FooterBodyItem,
  FooterBottom,
  FooterCopy,
  FooterLink,
  FooterOperator,
  Header,
  HeaderBody,
  HeaderNav,
  HeaderOperator,
  Logo,
  Service,
} from '@dataesr/react-dsfr';
import Link from 'next/link';
import { useContext } from 'react';
import LayoutContext from './LayoutContext';
import { menu } from './MainLayout.data';
import { GithubLogo, Main } from './MainLayout.style';
export {
  footerHeight,
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
  headerHeight,
  tabFooterHeight,
  tabHeaderHeight,
} from './MainLayout.data'; // TODO: remove this and use index.ts

const fcuHeaderDesc = `Un service public pour faciliter et accélérer les raccordements aux réseaux de chaleur`;
const fcuFooterDesc = `France Chaleur Urbaine est un projet d'innovation pour accélérer
  le raccordement des bâtiments aux réseaux de chaleur en vue de
  l'atteinte des objectifs de développement de la chaleur
  d'origine renouvelable.`;

type MainLayout = {
  children: React.ReactNode;
  fullscreen?: boolean;
};

const MainLayout: React.FC<MainLayout> = ({ children }) => {
  const { currentMenu, fullscreen } = useContext(LayoutContext);

  return (
    <>
      <Header>
        <HeaderBody>
          <Logo splitCharacter={10}>République Française</Logo>
          <HeaderOperator>
            <img
              height={81}
              src="./logo-fcu.png"
              alt="logo france chaleur urbaine"
            />
          </HeaderOperator>
          <Service
            title={
              <a className="fr-header__service-title fr-link--md">
                France Chaleur Urbaine
              </a>
            }
            description={fcuHeaderDesc}
            asLink={<Link href={'/'} title="Revenir à l'accueil" />}
          />
        </HeaderBody>
        <HeaderNav>
          {menu.map(({ label, url }) => (
            <li
              key={url}
              className={`fr-nav__item ${
                currentMenu === url ? 'fr-nav__item-Active' : ''
              }`}
            >
              <Link href={url} prefetch={false}>
                <a
                  className="fr-nav__link"
                  aria-current={currentMenu === url ? 'page' : undefined}
                >
                  {label}
                </a>
              </Link>
            </li>
          ))}
        </HeaderNav>
      </Header>

      <Main fullscreen={fullscreen}>{children}</Main>

      <Footer>
        <FooterBody description={fcuFooterDesc}>
          <Logo
            splitCharacter={10}
            asLink={<Link href={'/'} title="Revenir à l'accueil" />}
          >
            République Française
          </Logo>
          <FooterOperator>
            <img
              height={81}
              src="./logo-fcu.png"
              alt="logo france chaleur urbaine"
            />
          </FooterOperator>
          <FooterBodyItem>
            Faites nous part de vos propositions pour améliorer ce service :{' '}
            <br />
            <a
              href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
              target="_blank"
              rel="noreferrer"
            >
              france-chaleur-urbaine@developpement-durable.gouv.fr
            </a>
          </FooterBodyItem>
        </FooterBody>
        <FooterBottom>
          <FooterLink
            href="/accessibilite"
            asLink={<Link href="/accessibilite" prefetch={false}></Link>}
          >
            <a className="fr-footer__bottom-link">
              Accessibilité: non conforme
            </a>
          </FooterLink>
          <FooterLink
            asLink={<Link href="/mentions-legales" prefetch={false}></Link>}
          >
            <a className="fr-footer__bottom-link">Mentions légales & CGU</a>
          </FooterLink>
          <FooterLink href="/#consentement">
            Cookies &amp; Consentements
          </FooterLink>
          <FooterLink
            asLink={
              <Link
                href="/politique-de-confidentialite"
                prefetch={false}
              ></Link>
            }
          >
            <a className="fr-footer__bottom-link">Données personnelles</a>
          </FooterLink>
          <FooterLink asLink={<Link href="/stats" prefetch={false}></Link>}>
            <a className="fr-footer__bottom-link">Statistiques</a>
          </FooterLink>
          <FooterLink
            target="_blank"
            href="https://github.com/betagouv/france-chaleur-urbaine"
          >
            <GithubLogo
              src="./icons/github-brands.svg"
              alt=""
              aria-disabled="true"
            />{' '}
            Github
          </FooterLink>
          <FooterCopy>licence etalab-2.0</FooterCopy>
        </FooterBottom>
      </Footer>
    </>
  );
};
export default MainLayout;
