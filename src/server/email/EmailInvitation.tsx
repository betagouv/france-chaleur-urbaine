import { Text } from '@react-email/components';

import { DSFRButton, EmailTemplate, type EmailProps } from './helpers';

type EmailInvitationProps = EmailProps<{
  activationToken: string;
}>;

const EmailInvitation = (props: EmailInvitationProps) => {
  return (
    <EmailTemplate preview="France Chaleur Urbaine - création de votre espace">
      <Text>Bonjour,</Text>
      <Text>
        Votre espace France Chaleur Urbaine a été créé. Veuillez suivre le lien ci-dessous pour finaliser la création de votre compte.
      </Text>

      <DSFRButton href={`${props.websiteUrl}/connexion?activationToken=${props.activationToken}`}>Définir mon mot de passe</DSFRButton>

      <Text>Nous vous remercions pour votre collaboration et restons à votre disposition pour toute information complémentaire.</Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </EmailTemplate>
  );
};

export default EmailInvitation;
