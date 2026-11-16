import { TRPCError } from '@trpc/server';

import type { Context } from '@/modules/config/server/context-builder';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { getUserPreferences, updateUserPreferences } from '@/modules/users/server/service';
import { kdb } from '@/server/db/kysely';

import { ensureUserCanAccessDemand, ensureUserCanProcessDemand } from './helpers';

/**
 * Retourne les emails envoyés depuis l'UI pour une demande, après vérification des droits d'accès.
 */
export const listDemandEmails = async (ctx: Context, { demandId }: { demandId: string }) => {
  await ensureUserCanAccessDemand(ctx, demandId);
  return await kdb.selectFrom('demand_emails').selectAll().where('demand_id', '=', demandId).where('deleted_at', 'is', null).execute();
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

  await kdb.transaction().execute(async (transaction) => {
    await transaction
      .selectFrom('demands')
      .select('id')
      .where('id', '=', demandId)
      .where('deleted_at', 'is', null)
      .forUpdate()
      .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' }));
    await transaction
      .insertInto('demand_emails')
      .values({
        body: emailContent.body,
        cc: emailContent.cc.join(',') || '',
        created_at: new Date(),
        demand_id: demandId,
        email_key: key,
        object: emailContent.object,
        reply_to: emailContent.replyTo,
        sent_at: new Date(),
        signature: emailContent.signature,
        to: emailContent.to,
        updated_at: new Date(),
        user_email: user.email,
      })
      .execute();
  });

  const preferences = await getUserPreferences(user.id);
  if (preferences.email_signature !== emailContent.signature) {
    await updateUserPreferences(user.id, { email_signature: emailContent.signature });
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
