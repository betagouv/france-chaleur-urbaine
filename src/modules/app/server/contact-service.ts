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

  // TODO: replace with own database
  const { id }: any = await AirtableDB(Airtable.CONTACT).create({
    Nom: data.lastName,
    Prenom: data.firstName,
    Email: data.email,
    Telephone: data.phone,
    Objet: data.subject,
    Message: data.message,
    Date: new Date().toISOString(),
  });

  logger.info('contact form submitted', {
    id,
  });

  return { id, success: true };
};
