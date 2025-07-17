import CreationDemandeEmail from '@/server/email/react-email/templates/creation-demande';

const CreationDemandeEmailDebug = () => {
  return (
    <CreationDemandeEmail
      demand={{
        Adresse: '123 Rue de la Paix, 75000 Paris',
        Departement: 'Haut-Garonne',
        Structure: 'Copropriété',
        'Type de chauffage': 'Individuel',
        'Distance au réseau': 150,
      }}
    />
  );
};

export default CreationDemandeEmailDebug;
