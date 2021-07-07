import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../contactForm';

test('rendering and submitting contact form', async () => {
  const handleSubmit = jest.fn();
  render(<ContactForm onSubmit={handleSubmit} />);

  const filledInData = {
    needTopic: 'mon besoin',
    contactOperator: true,
    firstName: 'jean',
    lastName: 'dupont',
    email: 'test@test.com',
    phoneNumber: '0606060606',
    housingNumber: 1,
    heatingMethod: 'fioul',
    coOwnershipStatus: 'syndic',
    contactOrigin: 'mail',
    collectDataAgreement: true,
  };

  const userFillIn = (
    textLabel: string,
    valueToField: string | number | boolean
  ) => {
    userEvent.type(screen.getByLabelText(textLabel), valueToField.toString());
  };

  const userSelectIn = (
    textLabel: string,
    valueToField: string | number | boolean
  ) => {
    userEvent.selectOptions(
      screen.getByLabelText(textLabel),
      valueToField.toString()
    );
  };
  userFillIn('Quel est votre besoin ?', filledInData.needTopic);
  userFillIn(
    'Vous souhaitez que nous contactions pour vous l’exploitant de réseau de votre quartier',
    filledInData.contactOperator
  );
  userFillIn('Prénom', filledInData.firstName);
  userFillIn('Nom', filledInData.lastName);
  userFillIn('Email', filledInData.email);
  userFillIn('Téléphone', filledInData.phoneNumber);
  userFillIn('Nombre de logement', filledInData.housingNumber);
  userSelectIn('Votre mode de chauffage actuel', filledInData.heatingMethod);
  userSelectIn(
    'Votre statut au sein de la copropriété',
    filledInData.coOwnershipStatus
  );
  userSelectIn(
    'Comment avez-vous entendu parlé de France chaleur urbaine',
    filledInData.contactOrigin
  );

  userFillIn(
    'Les données collectées sont uniquement utilisées à des fins d’annalyse par le minitère de la transition écologique',
    filledInData.collectDataAgreement
  );

  userEvent.click(screen.getByRole('button', { name: /Envoyer ma demande/i }));

  await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(filledInData));
});
