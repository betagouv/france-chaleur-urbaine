import { TRPCError } from '@trpc/server';
import type { Insertable } from 'kysely';
import type { User } from 'next-auth';

import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { canUserAccessDemand, getUserPermissions } from '@/modules/permissions/server/service';
import type { Permission } from '@/modules/permissions/types';
import { type DemandEmails, kdb } from '@/server/db/kysely';

const ensureCanAccessDemandEmails = async ({
  user,
  demandId,
  permissions: providedPermissions,
}: {
  demandId: string;
  permissions?: Permission[];
  user: User;
}) => {
  if (user.role === 'admin') {
    return;
  }

  const demand = await kdb
    .selectFrom('demands')
    .select([
      'user_id',
      'network_id',
      'network_type',
      'validated',
      'commune_code',
      'epci_code',
      'ept_code',
      'departement_code',
      'region_code',
    ])
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow();

  if (user.role === 'particulier' || user.role === 'professionnel') {
    if (demand.user_id !== user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Unauthorized',
      });
    }
    return;
  }

  const permissions = providedPermissions ?? (await getUserPermissions(user.id));
  if (!canUserAccessDemand(user, permissions, demand)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Unauthorized',
    });
  }
};

/**
 * Retourne les emails envoyés depuis l'UI pour une demande, après vérification des droits d'accès.
 */
export const listDemandEmails = async ({ demandId, user, permissions }: { demandId: string; user: User; permissions?: Permission[] }) => {
  await ensureCanAccessDemandEmails({ demandId, permissions, user });
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
export const sendDemandEmail = async (params: {
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
  user: User;
}) => {
  const { demandId, emailContent, key, user } = params;

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
    'demands.custom-email',
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
