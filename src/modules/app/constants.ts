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
