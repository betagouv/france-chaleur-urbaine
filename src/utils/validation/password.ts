import { z } from 'zod';

export const passwordSchema = z.string().refine(
  (password) => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  },
  {
    message:
      'Le mot de passe doit contenir au moins 8 caractères, une lettre minuscule, une lettre majuscule et un chiffre.',
  }
);
