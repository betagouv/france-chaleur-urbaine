import CreationDemandeEmail from '@/server/email/react-email/templates/creation-demande';

const CreationDemandeEmailDebug = () => {
  return (
    <CreationDemandeEmail
      demand={{
        Adresse: '123 Rue de la Paix, 75000 Paris',
        Departement: 'Haut-Garonne',
        'Distance au réseau': 250,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      }}
    />
  );
};

export default CreationDemandeEmailDebug;
