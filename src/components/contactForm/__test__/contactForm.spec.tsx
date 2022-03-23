import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fieldLabelConsent } from '../components/contactConsent';
import { fieldLabelInformation } from '../components/contactInformation';
import ContactForm from '../contactForm';

test('rendering and submitting contact form', async () => {
  const handleSubmit = jest.fn();
  render(<ContactForm onSubmit={handleSubmit} isSubmitting={false} />);

  const filledInLabel = {
    ...fieldLabelConsent,
    ...fieldLabelInformation,
  };

  const filledInData = {
    email: 'test@test.com',
    nom: 'Dupont Jean',
    chauffage: filledInLabel.chauffage.input[2].value,
    collecterMesDonnees: true,
    partageAuGestionnaire: true,
  };

  const expected = {
    nom: filledInData.nom,
    email: filledInData.email,
    chauffage: filledInData.chauffage,
    collecterMesDonnees: filledInData.collecterMesDonnees,
    partageAuGestionnaire: filledInData.partageAuGestionnaire,
  };

  const userFillIn = (
    textLabel: string,
    valueToField: string | number | boolean
  ) => {
    userEvent.type(screen.getByLabelText(textLabel), valueToField.toString());
  };

  userFillIn(
    filledInLabel.collecterMesDonnees,
    filledInData.collecterMesDonnees
  );
  userFillIn(filledInLabel.nom, filledInData.nom);
  userFillIn(filledInLabel.email, filledInData.email);
  userFillIn(
    filledInLabel.partageAuGestionnaire,
    filledInData.partageAuGestionnaire
  );
  userFillIn(filledInLabel.chauffage.input[2].label, true);

  userEvent.click(screen.getByRole('button', { name: /Envoyer/i }));

  await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(expected));
});
