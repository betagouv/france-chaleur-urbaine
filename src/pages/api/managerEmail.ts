import { handleRouteErrors, invalidRouteError } from '@helpers/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import base from 'src/db/airtable';
import { sendManagerEmail } from 'src/services/email';
import { Airtable } from 'src/types/enum/Airtable';

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
      const emailData = JSON.parse(req.body);
      //Send email
      const htmlBody = emailData.emailContent.body.replace(
        /(?:\r\n|\r|\n)/g,
        '<br />'
      );
      await sendManagerEmail(
        emailData.emailContent.object,
        emailData.emailContent.to,
        htmlBody,
        emailData.emailContent.signature,
        emailData.emailContent.cc.split(','),
        emailData.emailContent.replyTo
      );

      await base(Airtable.UTILISATEURS_EMAILS).create(
        [
          {
            fields: {
              demand_id: emailData.demand_id,
              user_email: req.user.email,
              email_key: emailData.key,
              object: emailData.emailContent.object,
              body: emailData.emailContent.body,
              cc: emailData.emailContent.cc || '',
              reply_to: emailData.emailContent.replyTo,
              to: emailData.emailContent.to,
              signature: emailData.emailContent.signature,
            },
          },
        ],
        {
          typecast: true,
        }
      );

      //Update signature for the user
      if (req.user.signature !== emailData.emailContent.signature) {
        await db('users')
          .update({
            signature: emailData.emailContent.signature,
          })
          .where('email', req.user.email);
      }
      return res.status(200).send('Success');
    } else {
      throw invalidRouteError;
    }
  },
  {
    requireAuthentication: ['gestionnaire', 'admin'],
  }
);
