import {
  HeaderBody,
  Header as HeaderDS,
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
import { Fragment, useContext } from 'react';
import { USER_ROLE } from 'src/types/enum/UserRole';
import LayoutContext from './LayoutContext';
import { menu } from './MainLayout.data';
import { FullScreenHeader, FullScreenItems } from './MainLayout.style';
import Image from 'next/image';

const LogoutItem = () => (
  <Tool>
    <ToolItemGroup>
      <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
        Se déconnecter
      </ToolItem>
    </ToolItemGroup>
  </Tool>
);

const ToolItems = ({ session }: { session: Session | null }) => (
  <Tool>
    {session ? (
      <ToolItemGroup>
        <ToolItem asLink={<Link href="/qui-sommes-nous" className="fr-link" />}>
          Qui sommes-nous ?
        </ToolItem>
        {session.user.role === USER_ROLE.ADMIN ? (
          <ToolItem asLink={<Link href="/admin" className="fr-link" />}>
            Admin
          </ToolItem>
        ) : (
          <></>
        )}
        <ToolItem asLink={<Link href="/gestionnaire" className="fr-link" />}>
          Espace gestionnaire
        </ToolItem>
        <ToolItem onClick={() => signOut({ callbackUrl: '/' })}>
          Se déconnecter
        </ToolItem>
      </ToolItemGroup>
    ) : (
      <ToolItemGroup>
        <ToolItem asLink={<Link href="/qui-sommes-nous" className="fr-link" />}>
          Qui sommes-nous ?
        </ToolItem>
        <ToolItem asLink={<Link href="/connexion" className="fr-link" />}>
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

  const showLogout =
    currentMenu === '/gestionnaire' || currentMenu === '/admin';

  return (
    <HeaderDS>
      <Container>
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
          {!fullscreen && (
            <Service
              title={
                <a className="fr-header__service-title fr-link--md">
                  France Chaleur Urbaine
                </a>
              }
              description="Faciliter les raccordements aux réseaux de chaleur"
              asLink={
                <Link
                  legacyBehavior
                  href={indexLink}
                  title="Revenir à l'accueil"
                />
              }
            />
          )}
          {fullscreen ? (
            showLogout && <LogoutItem />
          ) : (
            <ToolItems session={session} />
          )}
        </HeaderBody>
      </Container>
      <HeaderNav>
        {fullscreen && (
          <li>
            <Image
              height={50}
              width={70}
              src="/logo-fcu.png"
              alt="logo france chaleur urbaine"
              priority
            />
          </li>
        )}
        <NavItem
          title="Copropriétaire, conseil syndical"
          current={currentMenu === indexLink}
          asLink={
            <Link href={indexLink}>Copropriétaire, conseil syndical</Link>
          }
        />

        {menu.map(({ label, url }) => (
          <NavItem
            key={url}
            title={label}
            current={currentMenu === url}
            asLink={<Link href={url}>{label}</Link>}
          />
        ))}
        {fullscreen && showLogout && (
          <FullScreenItems>
            <LogoutItem />
          </FullScreenItems>
        )}
      </HeaderNav>
    </HeaderDS>
  );
};

export default Header;
