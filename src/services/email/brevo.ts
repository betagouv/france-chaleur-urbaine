import {
  SendSmtpEmail,
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo';

class EmailService {
  private apiInstance: TransactionalEmailsApi;

  constructor(apiKey: string) {
    this.apiInstance = new TransactionalEmailsApi();
    this.apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }

  sendEmail(
    to: { email: string; name?: string }[],
    templateId?: number
  ): Promise<any> {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.to = to;
    sendSmtpEmail.templateId = templateId;

    return new Promise((resolve, reject) => {
      this.apiInstance.sendTransacEmail(sendSmtpEmail).then(
        (response) => {
          console.log('Email envoyé avec succès : ', JSON.stringify(response));
          resolve(response);
        },
        (error) => {
          console.error("Erreur lors de l'envoi de l'email : ", error);
          reject(error);
        }
      );
    });
  }
}

const emailService = new EmailService(process.env.BREVO_API_KEY || '');

export default emailService;
