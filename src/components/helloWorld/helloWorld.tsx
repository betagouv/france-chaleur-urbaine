import React from 'react';
import { Container } from './style';

function HelloWorld() {
  return (
    <Container>
      <h1>Hello World</h1>
      <label className="fr-label" htmlFor="text-input-text">
        Label champ de saisie
      </label>
      <input
        className="fr-input"
        type="text"
        id="text-input-text"
        name="text-input-text"
      ></input>
      <ul className="fr-accordions-group">
        <li>
          <section className="fr-accordion">
            <h3 className="fr-accordion__title">
              <button
                className="fr-accordion__btn"
                aria-expanded="false"
                aria-controls="accordion-89"
              >
                Intitulé accordéon
              </button>
            </h3>
            <div className="fr-collapse" id="accordion-89"></div>
          </section>
        </li>
        <li>
          <section className="fr-accordion">
            <h3 className="fr-accordion__title">
              <button
                className="fr-accordion__btn"
                aria-expanded="false"
                aria-controls="accordion-90"
              >
                Intitulé accordéon
              </button>
            </h3>
            <div className="fr-collapse" id="accordion-90"></div>
          </section>
        </li>
        <li>
          <section className="fr-accordion">
            <h3 className="fr-accordion__title">
              <button
                className="fr-accordion__btn"
                aria-expanded="false"
                aria-controls="accordion-91"
              >
                Intitulé accordéon
              </button>
            </h3>
            <div className="fr-collapse" id="accordion-91"></div>
          </section>
        </li>
      </ul>

      <button
        className="fr-btn"
        data-fr-opened="false"
        aria-controls="fr-modal-1"
        title="Titre de modal simple (ouvre une fenêtre modale)"
      >
        Titre de modal simple
      </button>

      <dialog
        aria-labelledby="fr-modal-title-modal-1"
        role="dialog"
        id="fr-modal-1"
        className="fr-modal"
      >
        <div className="fr-container--fluid fr-container-md">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-6">
              <div className="fr-modal__body">
                <div className="fr-modal__header">
                  <button
                    className="fr-link--close fr-link"
                    title="Fermer la fenêtre modale"
                    aria-controls="fr-modal-1"
                  >
                    Fermer
                  </button>
                </div>
                <div className="fr-modal__content">
                  <h1 id="fr-modal-title-modal-1" className="fr-modal__title">
                    <span className="fr-fi-arrow-right-line fr-fi--lg"></span>
                    Titre de la modale
                  </h1>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Maecenas varius tortor nibh, sit amet tempor nibh finibus
                    et. Aenean eu enim justo. Vestibulum aliquam hendrerit
                    molestie. Mauris malesuada nisi sit amet augue accumsan
                    tincidunt. Maecenas tincidunt, velit ac porttitor pulvinar,
                    tortor eros facilisis libero, vitae commodo nunc quam et
                    ligula. Ut nec ipsum sapien. Interdum et malesuada fames ac
                    ante ipsum primis in faucibus. Integer id nisi nec nulla
                    luctus lacinia non eu turpis. Etiam in ex imperdiet justo
                    tincidunt egestas. Ut porttitor urna ac augue cursus
                    tincidunt sit amet sed orci.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </Container>
  );
}

export default HelloWorld;
