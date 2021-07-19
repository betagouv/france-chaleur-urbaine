import Banner from '@components/banner/banner';
import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

const Main = styled.section`
  margin: 2em 0;
  min-height: 70vh;
`;

type MainLayout = {
  children: React.ReactNode;
  banner?: boolean;
};

const MainLayout: React.FC<MainLayout> = ({ children, banner = false }) => {
  return (
    <>
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br />
                      Française
                    </p>
                  </div>
                  <div className="fr-header__operator">
                    <img
                      className="fr-footer__logo"
                      src="./logo-FCU.png"
                      alt="logo france chaleur urbaine"
                    />
                  </div>
                </div>
                <div className="fr-header__service">
                  <Link href="/">
                    <a title="france chaleur urbaine">
                      <p className="fr-header__service-title">
                        France Chaleur Urbaine
                      </p>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="fr-header__menu fr-modal"
          id="modal-870"
          aria-labelledby="fr-btn-menu-mobile-2"
        >
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
              role="navigation"
              aria-label="Menu principal"
            >
              <ul className="fr-nav__list">
                <li className="fr-nav__item">
                  <Link href="/">
                    <a className="fr-nav__link">Accueil</a>
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link href="/ressources">
                    <a className="fr-nav__link">Ressources</a>
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link href="/partenaires">
                    <a className="fr-nav__link">Partenaires</a>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      {banner && <Banner />}
      <div className="fr-container">
        <Main className="fr-grid-row fr-grid-row--center">{children}</Main>
      </div>

      <footer className="fr-footer" role="contentinfo" id="footer">
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
                  src="./logo-FCU.png"
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
                <a className="fr-footer__bottom-link">
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
                  rel="noreferrer"
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
