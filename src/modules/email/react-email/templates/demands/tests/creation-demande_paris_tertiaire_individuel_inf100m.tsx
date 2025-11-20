import CreationDemandeEmail from '@/modules/email/react-email/templates/demands/user-new';

const CreationDemandeEmailDebug = () => {
  return (
    <CreationDemandeEmail
      demand={{
        Adresse: '123 Rue de la Paix, 75000 Paris',
        Departement: 'Paris',
        'Distance au réseau': 50,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Individuel',
      }}
    />
  );
};

export default CreationDemandeEmailDebug;
