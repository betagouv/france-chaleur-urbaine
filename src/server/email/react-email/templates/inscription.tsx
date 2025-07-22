import * as React from 'react';

import { clientConfig } from '@/client-config';

import { Layout, type LayoutModifiableProps } from '../components';
export const InscriptionEmail = (props: LayoutModifiableProps) => {
  const urlConnexion = `${clientConfig.websiteOrigin}/connexion`;
  const urlCollectivites = `${clientConfig.websiteOrigin}/collectivites-et-exploitants`;

  return (
    <Layout variant="markdown" {...props}>
      {`Bonjour,

Nous vous informons que **vous pouvez dès aujourd'hui accéder à votre « Espace gestionnaire » sur France Chaleur Urbaine**.

L'Espace gestionnaire permet aux collectivités et exploitants d'accéder à l'ensemble des demandes reçues via France Chaleur Urbaine sur leur territoire / leurs réseaux.

Pour accéder à cet espace, il vous suffit de cliquer sur « [Se connecter](${urlConnexion}) ». **Lors de la première connexion, il est nécessaire de cliquer sur "Mot de passe oublié" pour définir votre mot de passe.**

Si vous êtes destinataire de ce message, c'est qu'au moins une demande de raccordement a été reçue à proximité de votre réseau dans les derniers mois.

**Nous invitons les gestionnaires des réseaux à renseigner le statut des demandes dès lors qu'elles sont prises en charge**. Cette information a uniquement pour but de nous permettre d'évaluer l'impact de notre service à l'échelle nationale.

Pour rappel, [France Chaleur Urbaine](${urlCollectivites}) est un **service du ministère de la transition énergétique qui vise à accélérer la dynamique de raccordement aux réseaux de chaleur**. France Chaleur Urbaine permet :

- **aux copropriétaires et gestionnaires de bâtiments tertiaires** de vérifier si un réseau de chaleur passe près de leur adresse et d'être mis en relation avec le gestionnaire du réseau le plus proche ;
- **aux collectivités et exploitants des réseaux de chaleur** de disposer d'outils simples pour multiplier les raccordements à leurs réseaux.

Nous vous remercions pour votre collaboration et restons à votre disposition pour toute information complémentaire.

Bien cordialement,

L'équipe France Chaleur Urbaine
  `}
    </Layout>
  );
};

export default InscriptionEmail;
