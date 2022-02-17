import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../contactForm';

test('rendering and submitting contact form', async () => {
  const handleSubmit = jest.fn();
  render(<ContactForm onSubmit={handleSubmit} isSubmitting={false} />);

  const filledInData = {
    collectDataAgreement: true,
    email: 'test@test.com',
    patronyme: 'Dupont Jean',
  };

  const expected = {
    collecterMesDonnees: filledInData.collectDataAgreement,
    email: filledInData.email,
    nom: filledInData.patronyme,
  };

  const userFillIn = (
    textLabel: string,
    valueToField: string | number | boolean
  ) => {
    userEvent.type(screen.getByLabelText(textLabel), valueToField.toString());
  };

  userFillIn('Nom et Prénom', filledInData.patronyme);
  userFillIn('Email (*)', filledInData.email);

  userFillIn(
    'J’accepte que les données collectées soient uniquement utilisées à des fins d’analyse par le ministère de la transition écologique. (*)',
    filledInData.collectDataAgreement
  );

  userEvent.click(screen.getByRole('button', { name: /Envoyer/i }));

  await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(expected));
});
