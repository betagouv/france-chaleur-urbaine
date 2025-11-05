import type { NextApiRequest } from 'next';
import z from 'zod';
import * as demandsService from '@/modules/demands/server/demands-service';
import db from '@/server/db';
import { sendEmailTemplate } from '@/server/email';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';

export type ManagerEmailResponse = Awaited<ReturnType<typeof GET>>;

const GET = async (req: NextApiRequest) => {
  const { demand_id } = await validateObjectSchema(req.query, {
    demand_id: z.string(),
  });

  return await demandsService.listEmails(demand_id);
};

const zManagerEmail = {
  demand_id: z.string(),
  emailContent: z.object({
    body: z.string().transform((v) => {
      return v.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }),
    cc: z.preprocess((v) => {
      const str = String(v);
      return str ? str.split(',') : [];
    }, z.array(z.email().trim())),
    object: z.string(),
    replyTo: z.string().trim(),
    signature: z.string(),
    to: z.email().trim(),
  }),
  key: z.string(),
};

const POST = async (req: NextApiRequest) => {
  const parseReqBody = await JSON.parse(req.body);
  const { emailContent, demand_id, key } = await validateObjectSchema(parseReqBody, zManagerEmail);

  await demandsService.createEmail({
    body: emailContent.body,
    cc: emailContent.cc.join(',') || '',
    demand_id,
    email_key: key,
    object: emailContent.object,
    reply_to: emailContent.replyTo,
    signature: emailContent.signature,
    to: emailContent.to,
    user_email: req.user.email,
  });

  //Update signature for the user
  if (req.user.signature !== emailContent.signature) {
    await db('users')
      .update({
        signature: emailContent.signature,
      })
      .where('email', req.user.email);
  }

  await sendEmailTemplate(
    'manager-email',
    { email: emailContent.to, id: req.user.id },
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
};

export default handleRouteErrors(
  { GET, POST },
  {
    requireAuthentication: ['gestionnaire', 'admin'],
  }
);
