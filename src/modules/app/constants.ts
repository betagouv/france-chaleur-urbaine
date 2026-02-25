import { z } from 'zod';

export const contactReasonOptions = [
  {
    label: 'Suivre une demande déposée sur France Chaleur Urbaine',
    value: 'Suivi',
  },
  {
    label: 'Poser une question sur les réseaux de chaleur',
    value: 'question',
  },
  { label: 'Établir un partenariat', value: 'partenariat' },
  {
    label: 'Faire une suggestion pour le site',
    value: 'suggestion',
  },
  { label: 'Signaler un problème sur le site', value: 'probleme' },
  {
    label: 'Faire un retour sur le comparateur',
    value: 'comparateur',
  },
  { label: 'Autre', value: 'autre' },
];

export const contactFormSchema = z.object({
  email: z.email("Votre adresse email n'est pas valide"),
  firstName: z.string().min(1, 'Veuillez renseigner votre prénom'),
  lastName: z.string().min(1, 'Veuillez renseigner votre nom'),
  message: z.string().min(1, 'Veuillez renseigner votre message'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Veuillez sélectionner un objet'),
});

export const dataSourcesVersions = {
  arreteDpe: {
    link: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051520810',
    releaseDate: '11 avril 2025',
  },
  bdnb: {
    link: 'https://www.data.gouv.fr/datasets/base-de-donnees-nationale-des-batiments/',
    version: 'BDNB 2024-10.a',
  },
  bibliothequeFedene: {
    directLink:
      'https://fedene.fr/wp-content/uploads/2026/02/Bibliotheque-de-donnees-des-reseaux-de-chaleur-et-de-froid-Edition-2025-V1-1.xlsx',
    link: 'https://fedene.fr/ressource/bibliotheque-de-donnees-des-reseaux-de-chaleur-et-de-froid-2/',
    longTitle: 'bibliothèque nationale des données des réseaux de chaleur et de froid ',
    releaseDate: '02/2026',
    title: 'Bibliothèque FEDENE 2025 pour 2024',
  },
  donneesLocalesConsommationEnergieAdresse: {
    link: 'https://www.statistiques.developpement-durable.gouv.fr/donnees-locales-de-consommation-denergie',
    title: 'SDES pour 2024',
    year: '2024',
  },
  donneesLocalesEnergieReseaux: {
    link: 'https://www.statistiques.developpement-durable.gouv.fr/catalogue?page=datafile&datafileRid=b0c273bb-1578-42f3-b22b-074d78de3ca3&datafileMillesime=2024-09&tab=download',
    releaseDate: '09/2025',
    title: "Données locales de l'énergie pour 2024 (SDES)",
  },
};
