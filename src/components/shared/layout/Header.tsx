import {
  Header as HeaderDS,
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
import { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Fragment, useContext } from 'react';
import { USER_ROLE } from 'src/types/enum/UserRole';
import LayoutContext from './LayoutContext';
import { menu } from './MainLayout.data';
import { FullScreenHeader, FullScreenItems } from './MainLayout.style';

const ToolItems = ({ session }: { session: Session | null }) => (
  <Tool>
    {session ? (
      <ToolItemGroup>
        <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
          Se déconnecter
        </ToolItem>
        <ToolItem
          asLink={
            <Link href="/gestionnaire">
              <a className="fr-link">Espace gestionnaire</a>
            </Link>
          }
        >
          Espace gestionnaire
        </ToolItem>
        {session.user.role === USER_ROLE.ADMIN ? (
          <ToolItem
            asLink={
              <Link href="/admin">
                <a className="fr-link">Admin</a>
              </Link>
            }
          >
            Admin
          </ToolItem>
        ) : (
          <></>
        )}
      </ToolItemGroup>
    ) : (
      <ToolItemGroup>
        <ToolItem
          asLink={
            <Link href="/connexion">
              <a className="fr-link">Espace gestionnaire</a>
            </Link>
          }
        >
          Espace gestionnaire
        </ToolItem>
      </ToolItemGroup>
    )}
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
  const { indexLink } = useContext(LayoutContext);

  const Container = fullscreen ? FullScreenHeader : Fragment;

  return (
    <HeaderDS>
      <Container>
        <HeaderBody>
          <Logo splitCharacter={10}>République Française</Logo>
          <HeaderOperator>
            <img
              height={81}
              src="/logo-fcu.png"
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
              description="Faciliter les raccordements aux réseaux de chaleur"
              asLink={<Link href={indexLink} title="Revenir à l'accueil" />}
            />
          )}
          {!fullscreen && <ToolItems session={session} />}
        </HeaderBody>
      </Container>
      <HeaderNav>
        {fullscreen && (
          <li>
            <img
              height={50}
              src="/logo-fcu.png"
              alt="logo france chaleur urbaine"
            />
          </li>
        )}
        <NavItem
          title={'Accueil'}
          current={currentMenu === indexLink}
          asLink={
            <Link href={indexLink} legacyBehavior={false}>
              {'Accueil'}
            </Link>
          }
        />

        {menu.map(({ label, url, subMenus }) =>
          url ? (
            <NavItem
              key={url}
              title={label}
              current={currentMenu === url}
              asLink={
                <Link href={url} legacyBehavior={false}>
                  {label}
                </Link>
              }
            />
          ) : (
            <NavItem
              key={label}
              title={label}
              current={
                subMenus &&
                subMenus.some((subMenu) => subMenu.url === currentMenu)
              }
            >
              {subMenus &&
                subMenus.map(({ url, label }) => (
                  <NavSubItem
                    key={url}
                    title={label}
                    current={currentMenu === url}
                    asLink={
                      <Link href={url} legacyBehavior={false}>
                        {label}
                      </Link>
                    }
                  />
                ))}
            </NavItem>
          )
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
