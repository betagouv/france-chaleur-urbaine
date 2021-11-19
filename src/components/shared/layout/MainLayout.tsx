import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

const Main = styled.section`
  min-height: 70vh;
`;
const HeaderLogo = styled.img`
  width: auto;
  height: auto;
  max-height: 110px;
  max-width: 200px;
`;
const HeaderLabel = styled.p`
  font-size: 1.9rem;
  color: #069368;
`;
const HeaderSubLabel = styled.p`
  margin: 0;
`;

type MainLayout = {
  children: React.ReactNode;
  currentMenu?: string;
  banner?: boolean;
};

const menu = [
  {
    label: 'Accueil',
    url: '/',
  },
  {
    label: 'Documentation',
    url: 'ressources',
  },
  {
    label: 'Partenaires',
    url: 'partenaires',
  },
];

const MainLayout: React.FC<MainLayout> = ({ children, currentMenu }) => {
  return (
    <>
      <header className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br />
                      Française
                    </p>
                  </div>
                  <div className="fr-header__navbar">
                    <button
                      className="fr-btn--menu fr-btn"
                      data-fr-opened="false"
                      aria-controls="modal-870"
                      aria-haspopup="menu"
                      title="Menu"
                      id="fr-btn-menu-mobile-4"
                    >
                      Menu
                    </button>
                  </div>
                  <div className="fr-header__operator">
                    <Link href="/">
                      <a title="france chaleur urbaine">
                        <HeaderLogo
                          className="fr-footer__logo"
                          src="./logo-fcu.png"
                          alt="logo france chaleur urbaine"
                        />
                      </a>
                    </Link>
                  </div>
                </div>
                <div className="fr-header__service">
                  <Link href="/">
                    <a title="france chaleur urbaine">
                      <HeaderLabel className="fr-header__service-title">
                        France Chaleur Urbaine
                      </HeaderLabel>
                      <HeaderSubLabel>
                        Service public pour le raccordement des copropriétés aux
                        réseaux de chaleur
                      </HeaderSubLabel>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fr-header__menu fr-modal" id="modal-870">
          <div className="fr-container">
            <button
              className="fr-link--close fr-link"
              aria-controls="modal-870"
            >
              Fermer
            </button>
            <div className="fr-header__menu-links"></div>
            <nav
              className="fr-nav"
              id="header-navigation"
              aria-label="Menu principal"
            >
              <ul className="fr-nav__list">
                {menu.map(({ label, url }) => (
                  <li
                    key={url}
                    className={`fr-nav__item ${
                      currentMenu === url ? 'fr-nav__item--active' : ''
                    }`}
                  >
                    <a
                      className="fr-nav__link"
                      href={url}
                      aria-current={currentMenu === url ? 'page' : undefined}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <Main>{children}</Main>

      <footer className="fr-footer" id="footer">
        <div className="fr-container">
          <div className="fr-footer__body fr-footer__body--operator">
            <div className="fr-footer__brand fr-enlarge-link">
              <p className="fr-logo" title="république française">
                république
                <br />
                française
              </p>
              <a
                className="fr-footer__brand-link"
                href="/"
                title="Retour à l’accueil"
              >
                <img
                  className="fr-footer__logo"
                  src="./logo-fcu-with-typo.jpg"
                  alt="logo france chaleur urbaine"
                />
              </a>
            </div>
            <div className="fr-footer__content">
              <p className="fr-footer__content-desc">
                France Chaleur Urbaine est un projet d'innovation pour accélérer
                le raccordement des copropriétés aux réseaux de chaleur en vue
                de l'atteinte des objectifs de développement de la chaleur
                d'origine renouvelable.
                <br />
                <strong>
                  Faites nous part de vos propositions pour améliorer ce service
                  : <br />
                  <a href="mailto:france-chaleur-urbaine@beta.gouv.fr">
                    france-chaleur-urbaine@beta.gouv.fr
                  </a>
                </strong>
              </p>
            </div>
          </div>
          <div className="fr-footer__bottom">
            <ul className="fr-footer__bottom-list">
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="accessibilite">
                  Accessibilité: non conforme
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="mentions-legales">
                  Mentions légales
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="politique-de-confidentialite"
                >
                  Données personnelles
                </a>
              </li>
            </ul>
            <div className="fr-footer__bottom-copy">
              <p>
                Sauf mention contraire, tous les textes de ce site sont sous{' '}
                <a
                  href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  licence etalab-2.0
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
export default MainLayout;
