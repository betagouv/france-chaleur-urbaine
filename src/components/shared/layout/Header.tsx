import {
  Header as HeaderDS,
  HeaderBody,
  HeaderNav,
  HeaderOperator,
  Logo,
  Service,
} from '@dataesr/react-dsfr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Fragment } from 'react';
import { menu } from './MainLayout.data';
import { FullScreenHeader } from './MainLayout.style';

const fcuHeaderDesc = `Un service public pour faciliter et accélérer les raccordements aux réseaux de chaleur`;

const Header = ({
  currentMenu,
  fullscreen,
}: {
  currentMenu: string;
  fullscreen: boolean;
}) => {
  const { data: session } = useSession();
  const Container = fullscreen ? FullScreenHeader : Fragment;

  return (
    <HeaderDS>
      <Container>
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
      </Container>
      <HeaderNav>
        {fullscreen && (
          <li>
            <img
              height={56}
              src="./logo-fcu.png"
              alt="logo france chaleur urbaine"
            />
          </li>
        )}
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
        {session && (
          <li
            className={`fr-nav__item ${
              currentMenu === '/gestionnaire' ? 'fr-nav__item-Active' : ''
            }`}
          >
            <Link href={'/gestionnaire'} prefetch={false}>
              <a
                className="fr-nav__link"
                aria-current={
                  currentMenu === '/gestionnaire' ? 'page' : undefined
                }
              >
                Gestionnaire
              </a>
            </Link>
          </li>
        )}
      </HeaderNav>
    </HeaderDS>
  );
};

export default Header;
