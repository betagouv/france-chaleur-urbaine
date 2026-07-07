import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';

import CarteIframes from './content/carte-iframes.mdx';
import Comparateur from './content/comparateur.mdx';
import CycleDeVieDemande from './content/cycle-de-vie-demande.mdx';
import Eligibilite from './content/eligibilite.mdx';
import GestionReseaux from './content/gestion-reseaux.mdx';
import Glossaire from './content/glossaire.mdx';
import InscriptionComptes from './content/inscription-comptes.mdx';
import PerimetreDoc from './content/perimetre-doc.mdx';
import ReaffectationDemandes from './content/reaffectation-demandes.mdx';
import References from './content/references.mdx';
import RelancesNotifications from './content/relances-notifications.mdx';
import RoleAdmin from './content/role-admin.mdx';
import RoleCollectivite from './content/role-collectivite.mdx';
import RoleDemandeur from './content/role-demandeur.mdx';
import RoleGestionnaire from './content/role-gestionnaire.mdx';
import RolesPermissions from './content/roles-permissions.mdx';
import TestsAdressesPro from './content/tests-adresses-pro.mdx';

/** Groups in display order on the /admin/doc table of contents. */
export const docThemes = [
  { id: 'intro', label: 'Pour commencer' },
  { id: 'parcours', label: 'Parcours fonctionnels' },
  { id: 'roles', label: 'Rôles utilisateurs' },
  { id: 'references', label: 'Références générées depuis le code' },
] as const;

export type DocTheme = (typeof docThemes)[number]['id'];

export type DocPage = {
  Content: ComponentType<{ components?: MDXComponents }>;
  description: string;
  slug: string;
  theme: DocTheme;
  title: string;
};

/**
 * Registry of the business workflow documentation pages published under /admin/doc.
 * Add an MDX file in content/ and reference it here to publish a new page.
 */
export const docPages = [
  {
    Content: Glossaire,
    description: "Les termes métier employés dans la documentation et dans l'application. À lire en premier.",
    slug: 'glossaire',
    theme: 'intro',
    title: 'Glossaire',
  },
  {
    Content: PerimetreDoc,
    description: "Ce que cette documentation couvre, ce qu'elle ne couvre pas délibérément, et le niveau de confiance de chaque partie.",
    slug: 'perimetre-doc',
    theme: 'intro',
    title: 'Périmètre et limites',
  },
  {
    Content: InscriptionComptes,
    description:
      "Les trois parcours de création de compte, l'activation par email, les effets de bord de la connexion et le mot de passe oublié.",
    slug: 'inscription-comptes',
    theme: 'parcours',
    title: 'Inscription et comptes',
  },
  {
    Content: Eligibilite,
    description:
      "Comment l'éligibilité d'une adresse est calculée : géocodage, distances, seuils, réseaux classés et PDP, et les différents résultats possibles.",
    slug: 'eligibilite',
    theme: 'parcours',
    title: "Test d'éligibilité",
  },
  {
    Content: CycleDeVieDemande,
    description:
      "De la création à la clôture : enrichissements, affectation automatique au réseau, validation par l'équipe FCU, statuts et modifications par chaque rôle.",
    slug: 'cycle-de-vie-demande',
    theme: 'parcours',
    title: "Cycle de vie d'une demande",
  },
  {
    Content: RelancesNotifications,
    description:
      'Les automatismes autour des demandes : notification des gestionnaires, rappels, relances des demandeurs et boucle de satisfaction.',
    slug: 'relances-notifications',
    theme: 'parcours',
    title: 'Relances et notifications',
  },
  {
    Content: ReaffectationDemandes,
    description:
      "Comment une demande change de réseau : proposition par un gestionnaire ou une collectivité, arbitrage par l'équipe FCU, désaffectation.",
    slug: 'reaffectation-demandes',
    theme: 'parcours',
    title: 'Réaffectation des demandes',
  },
  {
    Content: TestsAdressesPro,
    description:
      "Les tests d'adresses en masse : import de fichier, traitement asynchrone, résultats, alertes de changement d'éligibilité et création de demandes groupées.",
    slug: 'tests-adresses-pro',
    theme: 'parcours',
    title: "Tests d'adresses en masse",
  },
  {
    Content: RolesPermissions,
    description:
      'Qui voit quoi et qui peut agir : le modèle de permissions, la règle « consulter vs traiter », les impostures et les accès API partenaires.',
    slug: 'roles-permissions',
    theme: 'parcours',
    title: 'Rôles et permissions',
  },
  {
    Content: GestionReseaux,
    description:
      'Côté admin : édition des tracés et leurs effets en chaîne (Airtable, tuiles, éligibilité), PDP et obligation de raccordement, relances réseau, organisations et accès API.',
    slug: 'gestion-reseaux',
    theme: 'parcours',
    title: 'Gestion des réseaux et PDP',
  },
  {
    Content: Comparateur,
    description:
      "Le comparateur de coûts et de CO2 : ses deux modes, ce qu'il compare, ses hypothèses (données 2024, aides), et ses liens avec l'éligibilité et les demandes.",
    slug: 'comparateur',
    theme: 'parcours',
    title: 'Comparateur de coûts et CO2',
  },
  {
    Content: CarteIframes,
    description:
      "La carte interactive, l'embarquement sur des sites partenaires (iframes) et l'attribution des conversions (entonnoir affichages → tests → demandes par source).",
    slug: 'carte-iframes',
    theme: 'parcours',
    title: 'Carte et intégrations (iframes)',
  },
  {
    Content: RoleGestionnaire,
    description:
      "Ce qu'un gestionnaire voit, reçoit et peut faire dans son espace, ce que FCU automatise pour lui, et un déroulé type de traitement d'une demande.",
    slug: 'role-gestionnaire',
    theme: 'roles',
    title: 'Rôle : gestionnaire',
  },
  {
    Content: RoleCollectivite,
    description:
      "Ce qu'une collectivité, une ALEC ou un CCRT voit et peut faire : suivi du territoire, tri des demandes non affectées, propositions de réaffectation.",
    slug: 'role-collectivite',
    theme: 'roles',
    title: 'Rôle : collectivité, ALEC, CCRT',
  },
  {
    Content: RoleDemandeur,
    description:
      "Ce qu'un particulier ou un professionnel voit et peut faire : dépôt et suivi de ses demandes, tests d'adresses, boucle de satisfaction.",
    slug: 'role-demandeur',
    theme: 'roles',
    title: 'Rôle : particulier et professionnel',
  },
  {
    Content: RoleAdmin,
    description:
      "Ce que voit et pilote l'équipe France Chaleur Urbaine : validation et affectation des demandes, gestion des utilisateurs, réseaux et organisations, outils système.",
    slug: 'role-admin',
    theme: 'roles',
    title: 'Rôle : admin',
  },
  {
    Content: References,
    description:
      'Inventaires générés depuis le code, toujours à jour : emails et leurs déclencheurs, tâches planifiées, statuts de demande, événements de traçabilité.',
    slug: 'references',
    theme: 'references',
    title: 'Références',
  },
] as const satisfies readonly DocPage[];
