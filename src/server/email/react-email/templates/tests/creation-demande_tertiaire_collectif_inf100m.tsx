import CreationDemandeEmail from '@/server/email/react-email/templates/creation-demande';

const CreationDemandeEmailDebug = () => {
  return (
    <CreationDemandeEmail
      demand={{
        Adresse: '123 Rue de la Paix, 75000 Paris',
        Departement: 'Haut-Garonne',
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
        'Distance au réseau': 80,
      }}
    />
  );
};

export default CreationDemandeEmailDebug;
