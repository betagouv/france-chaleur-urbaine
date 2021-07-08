import React from 'react';
import styled from 'styled-components';

const Main = styled.section`
  margin: 2em 0;
  min-height: 70vh;
`;
const MainLayout: React.FC = ({ children }) => {
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
                      src="./defaultPic.jpeg"
                      alt="logo france chaleur urbaine"
                    />
                  </div>
                </div>
                <div className="fr-header__service">
                  <a
                    href="/"
                    title="Accueil - [À MODIFIER | Nom du site / service]"
                  >
                    <p className="fr-header__service-title">
                      France Chaleur Urbaine
                    </p>
                  </a>
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
                  <a className="fr-nav__link" href="ressources" target="_self">
                    Ressources
                  </a>
                </li>
                <li className="fr-nav__item">
                  <a className="fr-nav__link" href="partenaires" target="_self">
                    Partenaires
                  </a>
                </li>
                <li className="fr-nav__item">
                  <a className="fr-nav__link" href="#" target="_self">
                    Cartographie
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
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
                  src="./defaultPic.jpeg"
                  alt="logo france chaleur urbaine"
                />
              </a>
            </div>
            <div className="fr-footer__content">
              <p className="fr-footer__content-desc">
                Texte optionnel 3 lignes maximum.
                <br /> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Consectetur et vel quam auctor semper. Cras si amet mollis
                dolor.
              </p>
              <ul className="fr-footer__content-list">
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://legifrance.gouv.fr"
                  >
                    legifrance.gouv.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://gouvernement.fr"
                  >
                    gouvernement.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://service-public.fr"
                  >
                    service-public.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="https://data.gouv.fr"
                  >
                    data.gouv.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="fr-footer__bottom">
            <ul className="fr-footer__bottom-list">
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="#">
                  Plan du site
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="#">
                  Accessibilité: partiellement
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="/mentions-legales">
                  Mentions légales
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="#">
                  Données personnelles
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href="#">
                  Gestion des cookies
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a
                  className="fr-footer__bottom-link"
                  href="/politique-de-confidentialite"
                >
                  Politique de confidentialité
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
