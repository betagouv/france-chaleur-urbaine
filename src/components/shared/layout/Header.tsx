import {
  Header as HeaderDS,
  HeaderBody,
  HeaderNav,
  HeaderOperator,
  Logo,
  NavItem,
  Service,
  Tool,
  ToolItem,
  ToolItemGroup,
} from '@dataesr/react-dsfr';
import { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Fragment } from 'react';
import { menu } from './MainLayout.data';
import { FullScreenHeader, FullScreenItems } from './MainLayout.style';

const fcuHeaderDesc = `Un service public pour faciliter et accélérer les raccordements aux réseaux de chaleur`;

const ToolItems = ({ session }: { session: Session | null }) => (
  <Tool>
    <ToolItemGroup>
      {session ? (
        <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
          Se déconnecter
        </ToolItem>
      ) : (
        <ToolItem
          asLink={
            <Link href="/connexion">
              <a className="fr-link">Espace gestionnaire</a>
            </Link>
          }
        >
          Espace gestionnaire
        </ToolItem>
      )}
    </ToolItemGroup>
  </Tool>
);

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
          {!fullscreen && (
            <Service
              title={
                <a className="fr-header__service-title fr-link--md">
                  France Chaleur Urbaine
                </a>
              }
              description={fcuHeaderDesc}
              asLink={<Link href={'/'} title="Revenir à l'accueil" />}
            />
          )}
          {!fullscreen && <ToolItems session={session} />}
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
          <NavItem
            key={url}
            title={label}
            current={currentMenu === url}
            asLink={
              <div>
                <Link href={url}>{label}</Link>
              </div>
            }
          />
        ))}
        {session && (
          <NavItem
            title="Espace gestionnaire"
            current={currentMenu === '/gestionnaire'}
            asLink={
              <div>
                <Link href="/gestionnaire">Espace gestionnaire</Link>
              </div>
            }
          />
        )}
        {fullscreen && (
          <FullScreenItems>
            <ToolItems session={session} />
          </FullScreenItems>
        )}
      </HeaderNav>
    </HeaderDS>
  );
};

export default Header;
