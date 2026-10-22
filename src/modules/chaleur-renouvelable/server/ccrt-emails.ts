import { TRPCError } from '@trpc/server';
import type { z } from 'zod';

import type { Context } from '@/modules/config/server/context-builder';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { updateUserPreferences } from '@/modules/users/server/service';
import { kdb } from '@/server/db/kysely';
import { escapeHtml } from '@/utils/html';

import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT, type zCcrtSendEmail } from '../constants';
import { ensureCcrtDemandAccess } from './ccrt-access';
import { applyCcrtFollowUpUpdate } from './ccrt-demand-update';
import { getCcrtServerTrackingProperties, recordCcrtFollowUpChanges, recordCcrtPostHogEvent } from './ccrt-tracking';

/**
 * Reserves an idempotent send before SMTP; only successful sends enter the shared history and update the status.
 */
export const sendCcrtEmail = async (ctx: Context, input: z.infer<typeof zCcrtSendEmail>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const emailContent = input.emailContent;
  const message = {
    body: emailContent.body,
    cc: emailContent.cc,
    object: emailContent.object,
    reply_to: emailContent.replyTo,
    signature: emailContent.signature,
    to: demand.email,
  };
  const reservation = await kdb
    .insertInto('ccrt_demand_emails')
    .values({
      author_id: ctx.user.id,
      ...message,
      demand_id: demand.id,
      id: input.messageId,
    })
    .onConflict((conflict) => conflict.column('id').doNothing())
    .returning('id')
    .executeTakeFirst();
  if (!reservation) {
    const previousSend = await kdb
      .selectFrom('ccrt_demand_emails')
      .select('status')
      .where('id', '=', input.messageId)
      .where('demand_id', '=', demand.id)
      .where('author_id', '=', ctx.user.id)
      .executeTakeFirst();
    if (previousSend?.status === 'sent') {
      return { id: input.messageId };
    }
    const retry = await kdb
      .updateTable('ccrt_demand_emails')
      .set({ ...message, status: 'pending' })
      .where('id', '=', input.messageId)
      .where('demand_id', '=', demand.id)
      .where('author_id', '=', ctx.user.id)
      .where('status', '=', 'failed')
      .returning('id')
      .executeTakeFirst();
    if (!retry) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Ce message est déjà en cours d’envoi. Actualisez le suivi avant de réessayer.' });
    }
  }
  try {
    await sendEmailTemplate(
      'demands.demandeur.message-gestionnaire',
      { email: demand.email, id: demand.id },
      {
        content: escapeHtml(emailContent.body).replaceAll('\n', '<br />'),
        signature: emailContent.signature,
      },
      {
        cc: emailContent.cc ? emailContent.cc.split(',').map((email) => email.trim()) : [],
        replyTo: emailContent.replyTo,
        subject: emailContent.object,
      }
    );
  } catch {
    await kdb.updateTable('ccrt_demand_emails').set({ status: 'failed' }).where('id', '=', input.messageId).execute();
    ctx.logger.error('CCRT email delivery failed', { demandId: demand.id, messageId: input.messageId });
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'L’envoi du message a échoué. Vous pouvez réessayer.' });
  }
  // Keep a pending reservation if persistence fails after SMTP: retrying must not send the same message twice.
  const followUp = await kdb.transaction().execute(async (transaction) => {
    await transaction
      .updateTable('ccrt_demand_emails')
      .set({ sent_at: new Date(), status: 'sent' })
      .where('id', '=', input.messageId)
      .execute();
    await createUserEvent(
      {
        author_id: ctx.user.id,
        context_id: demand.id,
        context_type: 'ccrt_demand',
        data: { messageId: input.messageId, object: emailContent.object, to: demand.email },
        type: 'ccrt_demand_email_sent',
      },
      transaction
    );
    const result = input.updateStatusOnSend
      ? await applyCcrtFollowUpUpdate(
          ctx,
          { demandId: demand.id, trigger: 'contact', values: { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT } },
          transaction
        )
      : undefined;
    await updateUserPreferences(ctx.user.id, { email_signature: emailContent.signature }, transaction);
    return result;
  });
  if (followUp) {
    await recordCcrtFollowUpChanges(ctx, demand, followUp.changes, 'contact');
  }
  await recordCcrtPostHogEvent({
    distinctId: ctx.user.id,
    event: 'ccrt_demande:email_sent',
    properties: await getCcrtServerTrackingProperties(ctx, demand),
  });
  return { id: input.messageId };
};
