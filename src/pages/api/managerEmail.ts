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
    email_key: record.get('email_key'),
    object: record.get('object'),
    body: record.get('body'),
    date: record.get('sent_at'),
    to: record.get('to'),
    cc: record.get('cc'),
    reply_to: record.get('reply_to'),
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
  emailContent: z.object({
    object: z.string(),
    to: z.email().trim(),
    body: z.string().transform((v) => {
      return v.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }),
    signature: z.string(),
    cc: z.preprocess((v) => {
      const str = String(v);
      return str ? str.split(',') : [];
    }, z.array(z.email().trim())),
    replyTo: z.string().trim(),
  }),
  demand_id: z.string(),
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
          demand_id,
          user_email: req.user.email,
          email_key: key,
          object: emailContent.object,
          body: emailContent.body,
          cc: emailContent.cc.join(',') || '',
          reply_to: emailContent.replyTo,
          to: emailContent.to,
          signature: emailContent.signature,
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
    { id: req.user.id, email: emailContent.to },
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
