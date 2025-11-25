import CreationDemandeEmail from '@/modules/email/react-email/templates/demands/user-new';

const CreationDemandeEmailDebug = () => {
  return (
    <CreationDemandeEmail
      demand={{
        Adresse: '123 Rue de la Paix, 75000 Paris',
        Departement: 'Haut-Garonne',
        'Distance au réseau': 150,
        Structure: 'Copropriété',
        'Type de chauffage': 'Individuel',
      }}
    />
  );
};

export default CreationDemandeEmailDebug;
