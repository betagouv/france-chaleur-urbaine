import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import base from 'src/db/airtable';
import { authenticatedUser } from 'src/services/api/authentication';
import { sendManagerEmail } from 'src/services/email';
import { Airtable } from 'src/types/enum/Airtable';

export default async function managerEmail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await authenticatedUser(req, res);
  if (!user) {
    return res.status(204).json([]);
  }

  if (req.method !== 'POST') {
    return res.status(501);
  }
  try {
    const emailData = JSON.parse(req.body);
    //TODO gestion du KO -- affiche un message d'erreur + logger chez nous ?

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
            user_email: user.email,
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
    if (user.signature !== emailData.emailContent.signature) {
      await db('users')
        .update({
          signature: req.body,
        })
        .where('email', user.email);
    }

    return res.status(200).send('Success');
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
