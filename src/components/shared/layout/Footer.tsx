import {
  Footer as FooterDS,
  FooterBody,
  FooterBodyItem,
  FooterBottom,
  FooterCopy,
  FooterLink,
  FooterOperator,
  FooterPartners,
  FooterPartnersLogo,
  FooterPartnersSecondaryTitle,
  FooterPartnersTitle,
  Logo,
} from '@dataesr/react-dsfr';
import Link from 'next/link';
import { GithubLogo } from './MainLayout.style';

const fcuFooterDesc = `France Chaleur Urbaine est un projet d'innovation pour accélérer
  le raccordement des bâtiments aux réseaux de chaleur en vue de
  l'atteinte des objectifs de développement de la chaleur
  d'origine renouvelable.`;

const Footer = () => {
  return (
    <FooterDS>
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
          Faites nous part de vos propositions pour améliorer ce service :
          <br />
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
            france-chaleur-urbaine@developpement-durable.gouv.fr
          </a>
        </FooterBodyItem>
      </FooterBody>
      <FooterPartners>
        <FooterPartnersTitle>A l'origine du projet</FooterPartnersTitle>
        <FooterPartnersSecondaryTitle>
          Nos financeurs
        </FooterPartnersSecondaryTitle>
        <FooterPartnersLogo
          isMain
          href="http://www.driee.ile-de-france.developpement-durable.gouv.fr/"
          imageSrc="./logo-DRIEAT.png"
          target="_blank"
          imageAlt="DRIEAT"
        />
        <FooterPartnersLogo
          href="https://www.gouvernement.fr/"
          imageSrc="./logo-government.svg"
          target="_blank"
          imageAlt="Gouvernement"
        />
        <FooterPartnersLogo
          href="https://www.ademe.fr"
          imageSrc="./logo-ADEME.svg"
          target="_blank"
          imageAlt="Gouvernement"
        />
        <FooterPartnersLogo
          href="https://www.economie.gouv.fr/plan-de-relance"
          imageSrc="./logo-relance.png"
          target="_blank"
          imageAlt="France relance"
        />
      </FooterPartners>
      <FooterBottom>
        <FooterLink
          href="/accessibilite"
          asLink={<Link href="/accessibilite" prefetch={false}></Link>}
        >
          <a className="fr-footer__bottom-link">Accessibilité: non conforme</a>
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
            <Link href="/politique-de-confidentialite" prefetch={false}></Link>
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
    </FooterDS>
  );
};

export default Footer;
