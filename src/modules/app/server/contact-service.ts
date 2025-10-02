import { serverConfig } from '@/server/config';
import { AirtableDB } from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';

export type ContactFormData = {
  lastName: string;
  firstName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export const createContact = async (data: ContactFormData) => {
  if (serverConfig.email.notAllowed.includes(data.email)) {
    throw new Error(serverConfig.email.notAllowedMessage);
  }

  const { id }: any = await AirtableDB(Airtable.CONTACT).create({
    Date: new Date().toISOString(),
    Email: data.email,
    Message: data.message,
    Nom: data.lastName,
    Objet: data.subject,
    Prenom: data.firstName,
    Telephone: data.phone,
  });

  logger.info('contact form submitted', {
    id,
  });

  return { id, success: true };
};
