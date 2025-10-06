import type { NextApiRequest } from 'next';
import z from 'zod';

import db from '@/server/db';
import base from '@/server/db/airtable';
import { sendEmailTemplate } from '@/server/email';
import { handleRouteErrors, validateObjectSchema } from '@/server/helpers/server';
import { Airtable } from '@/types/enum/Airtable';
import { zAirtableRecordId } from '@/utils/validation';

export type ManagerEmailResponse = Awaited<ReturnType<typeof GET>>;

const GET = async (req: NextApiRequest) => {
  const { demand_id } = await validateObjectSchema(req.query, {
    demand_id: zAirtableRecordId,
  });

  const rawEmailsList = await base(Airtable.UTILISATEURS_EMAILS)
    .select({
      filterByFormula: `{demand_id} = "${demand_id}"`,
    })
    .all();

  const emailsList = rawEmailsList.map((record) => ({
    body: record.get('body'),
    cc: record.get('cc'),
    date: record.get('sent_at'),
    email_key: record.get('email_key'),
    object: record.get('object'),
    reply_to: record.get('reply_to'),
    to: record.get('to'),
  }));

  return emailsList as {
    email_key: string;
    object: string;
    body: string;
    date: string;
    to: string;
    cc?: string;
    reply_to: string;
  }[];
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

  //Log the email
  await base(Airtable.UTILISATEURS_EMAILS).create(
    [
      {
        fields: {
          body: emailContent.body,
          cc: emailContent.cc.join(',') || '',
          demand_id,
          email_key: key,
          object: emailContent.object,
          reply_to: emailContent.replyTo,
          signature: emailContent.signature,
          to: emailContent.to,
          user_email: req.user.email,
        },
      },
    ],
    {
      typecast: true,
    }
  );

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
