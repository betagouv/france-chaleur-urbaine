import { z } from 'zod';

export const zAirtableRecordId = z.string().regex(/^[a-zA-Z0-9]{17}$/); // e.g. rec6nCFUO7Nzj6M9n

export const zPassword = z.string().refine(
  (password) => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  },
  {
    message: 'Le mot de passe doit contenir au moins 8 caractères, une lettre minuscule, une lettre majuscule et un chiffre.',
  }
);
