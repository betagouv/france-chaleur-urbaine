import { z } from 'zod';

export const contactReasonOptions = [
  {
    value: 'Suivi',
    label: 'Suivre une demande déposée sur France Chaleur Urbaine',
  },
  {
    value: 'question',
    label: 'Poser une question sur les réseaux de chaleur',
  },
  { value: 'partenariat', label: 'Établir un partenariat' },
  {
    value: 'suggestion',
    label: 'Faire une suggestion pour le site',
  },
  { value: 'probleme', label: 'Signaler un problème sur le site' },
  {
    value: 'comparateur',
    label: 'Faire un retour sur le comparateur',
  },
  { value: 'autre', label: 'Autre' },
];

export const contactFormSchema = z.object({
  lastName: z.string().min(1, 'Veuillez renseigner votre nom'),
  firstName: z.string().min(1, 'Veuillez renseigner votre prénom'),
  email: z.email("Votre adresse email n'est pas valide"),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Veuillez sélectionner un objet'),
  message: z.string().min(1, 'Veuillez renseigner votre message'),
});
