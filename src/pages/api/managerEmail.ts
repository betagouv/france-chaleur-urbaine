import {
  handleRouteErrors,
  invalidRouteError,
  validateObjectSchema,
} from '@helpers/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import z from 'zod';
import db from 'src/db';
import base from 'src/db/airtable';
import { sendManagerEmail } from 'src/services/email';
import { Airtable } from 'src/types/enum/Airtable';

const zManagerEmail = {
  emailContent: z.object({
    object: z.string(),
    to: z.string().email().trim(),
    body: z.string().transform((v) => {
      return v.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }),
    signature: z.string(),
    cc: z.preprocess((v) => {
      return String(v).split(',');
    }, z.array(z.string().email().trim())),
    replyTo: z.string().trim(),
  }),
  demand_id: z.string(),
  key: z.string(),
};

export default handleRouteErrors(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'GET') {
      const { demand_id } = req.query;
      const rawEmailsList = await base(Airtable.UTILISATEURS_EMAILS)
        .select({
          filterByFormula: `{demand_id} = "${demand_id}"`,
        })
        .all();
      const emailsList = rawEmailsList.map((record) => ({
        email_key: record.get('email_key'),
        date: record.get('sent_at')
          ? new Date(record.get('sent_at') as string).toLocaleDateString(
              'fr-FR'
            )
          : '',
      }));
      return res.json(emailsList);
    } else if (req.method === 'POST') {
      const parseReqBody = await JSON.parse(req.body);
      const { emailContent, demand_id, key } = await validateObjectSchema(
        parseReqBody,
        zManagerEmail
      );

      //Log the email
      await base(Airtable.UTILISATEURS_EMAILS).create(
        [
          {
            fields: {
              demand_id: demand_id,
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

      //Send email
      await sendManagerEmail(
        emailContent.object,
        emailContent.to,
        emailContent.body,
        emailContent.signature,
        emailContent.cc,
        emailContent.replyTo
      );

      return res.status(200).send('Success');
    } else {
      throw invalidRouteError;
    }
  },
  {
    requireAuthentication: ['gestionnaire', 'admin'],
  }
);
