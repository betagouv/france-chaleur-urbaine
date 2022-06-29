import {
  Header as HeaderDS,
  HeaderBody,
  HeaderNav,
  HeaderOperator,
  Logo,
  Service,
} from '@dataesr/react-dsfr';
import Link from 'next/link';
import { menu } from './MainLayout.data';

const fcuHeaderDesc = `Un service public pour faciliter et accélérer les raccordements aux réseaux de chaleur`;

const Header = ({ currentMenu }: { currentMenu: string }) => {
  return (
    <HeaderDS>
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
    </HeaderDS>
  );
};

export default Header;
