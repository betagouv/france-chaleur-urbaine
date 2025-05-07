import { z } from 'zod';

import { type EmailTemplates } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';

export const tableName = 'email_templates';

const baseModel = createBaseModel(tableName);

const emailTemplateList = [
  {
    id: 'askForPieces',
    name: 'Demande d’éléments complémentaires',
    subject: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,

Vous avez réalisé une demande de raccordement au réseau de chaleur pour le {{Adresse}} sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Afin de pouvoir étudier votre demande, nous vous remercions de nous transmettre les éléments complémentaires suivants :
-
-
-

Cordialement,`,
  },
  {
    id: 'koFarFromNetwok',
    name: 'Non réalisable – éloignement au réseau',
    subject: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,

Vous avez réalisé une demande de raccordement au réseau de chaleur pour le {{Adresse}} sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Néanmoins, suite à l’analyse de votre demande, il apparaît que la distance entre votre bâtiment et le réseau de chaleur est trop importante pour qu’un raccordement soit pertinent d’un point de vue technique et économique.

Des développements du réseau sont possibles dans les années à venir. Nous conservons donc votre demande afin que vous puissiez être recontacté si le raccordement de votre bâtiment devenait réalisable.

Cordialement,`,
  },
  {
    id: 'koIndividualHeat',
    name: 'Non réalisable – chauffage individuel',
    subject: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,

Vous avez réalisé une demande de raccordement au réseau de chaleur pour le {{Adresse}} sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Néanmoins, le raccordement de votre bâtiment n’est pas réalisable au vu de votre chauffage actuel individuel : il nécessiterait des travaux extrêmement conséquents et coûteux pour mettre en place un système de canalisations internes à l’immeuble permettant de distribuer la chaleur aux différents logements.

Cordialement,`,
  },
  {
    id: 'koOther',
    name: 'Non réalisable – autre motif',
    subject: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,

Vous avez réalisé une demande de raccordement au réseau de chaleur pour le {{Adresse}} sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Néanmoins, suite à l’analyse de votre demande, nous sommes au regret de vous informer que le raccordement de votre bâtiment ne peut être réalisé.

Cordialement,`,
  },
  {
    id: 'receipt',
    name: 'Accusé réception',
    subject: 'Votre demande de raccordement au réseau de chaleur',
    body: `Bonjour,

Vous avez réalisé une demande de raccordement au réseau de chaleur pour le {{Adresse}} sur France Chaleur Urbaine.

Nous vous remercions pour l’intérêt que vous portez à ce mode de chauffage. Votre demande est bien prise en compte, nous reviendrons vers vous dans les meilleurs délais.

Cordialement,`,
  },
] as const;

export const create = baseModel.createMine;
export const list: typeof baseModel.listMine = async (config, context) => {
  const mines = await baseModel.listMine(config, context);

  return {
    items: [...(emailTemplateList as unknown as EmailTemplates[]), ...mines.items],
    count: mines.count + emailTemplateList.length,
  };
};

export const get = baseModel.getMine;
export const update = baseModel.updateMine;
export const remove = baseModel.removeMine;

export const validation = {
  create: z.object({
    name: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
  update: z.object({
    name: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
  }),
};
