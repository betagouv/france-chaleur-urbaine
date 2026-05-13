import type { Insertable } from 'kysely';

import type { Context } from '@/modules/config/server/context-builder';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { type DemandEmails, kdb } from '@/server/db/kysely';

import { ensureUserCanAccessDemand, ensureUserCanProcessDemand } from './helpers';

/**
 * Retourne les emails envoyés depuis l'UI pour une demande, après vérification des droits d'accès.
 */
export const listDemandEmails = async (ctx: Context, { demandId }: { demandId: string }) => {
  await ensureUserCanAccessDemand(ctx, demandId);
  return await kdb.selectFrom('demand_emails').selectAll().where('demand_id', '=', demandId).execute();
};

const createDemandEmail = async (values: Omit<Insertable<DemandEmails>, 'created_at' | 'updated_at' | 'id'>) => {
  const [createdEmail] = await kdb
    .insertInto('demand_emails')
    .values({ ...values, created_at: new Date(), sent_at: new Date(), updated_at: new Date() })
    .returningAll()
    .execute();
  return createdEmail;
};

/**
 * Envoie un email personnalisé depuis l'UI au contact d'une demande, l'archive en base et trace l'événement.
 * Met à jour la signature de l'utilisateur si elle a changé.
 */
export const sendDemandEmail = async (
  ctx: Context,
  params: {
    demandId: string;
    emailContent: {
      body: string;
      cc: string[];
      object: string;
      replyTo: string;
      signature: string;
      to: string;
    };
    key: string;
  }
) => {
  const { demandId, emailContent, key } = params;
  const { user } = ctx;

  await ensureUserCanProcessDemand(ctx, demandId);

  await createDemandEmail({
    body: emailContent.body,
    cc: emailContent.cc.join(',') || '',
    demand_id: demandId,
    email_key: key,
    object: emailContent.object,
    reply_to: emailContent.replyTo,
    signature: emailContent.signature,
    to: emailContent.to,
    user_email: user.email,
  });

  if (user.signature !== emailContent.signature) {
    await kdb.updateTable('users').set({ signature: emailContent.signature }).where('email', '=', user.email).execute();
  }

  await sendEmailTemplate(
    'demands.demandeur.message-gestionnaire',
    { email: emailContent.to, id: user.id },
    {
      content: emailContent.body,
      signature: emailContent.signature,
    },
    {
      cc: emailContent.cc,
      replyTo: emailContent.replyTo,
      subject: emailContent.object,
    }
  );

  await createUserEvent({
    author_id: user.id,
    context_id: demandId,
    context_type: 'demand',
    data: { key, object: emailContent.object, to: emailContent.to },
    type: 'demand_email_sent',
  });
};
