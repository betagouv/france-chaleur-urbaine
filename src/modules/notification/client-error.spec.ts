import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { getUserFacingErrorMessage } from './client-error';

describe('getUserFacingErrorMessage()', () => {
  const testCases: TestCase<unknown, string | undefined>[] = [
    {
      expectedOutput: "L'adresse email n'est pas valide",
      input: {
        data: { httpStatus: 400, zodError: { errors: [], properties: { email: { errors: ["L'adresse email n'est pas valide"] } } } },
        message: '[{"code":"invalid_format"}]',
      },
      label: 'erreur zod tRPC de premier niveau → message du champ',
    },
    {
      expectedOutput: 'Ce champ est obligatoire',
      input: {
        data: {
          httpStatus: 400,
          zodError: {
            errors: [],
            properties: { payload: { errors: [], properties: { gestionnaire: { errors: ['Ce champ est obligatoire'] } } } },
          },
        },
        message: '[{"code":"too_small"}]',
      },
      label: 'erreur zod tRPC imbriquée (payload.gestionnaire) → message du champ',
    },
    {
      expectedOutput: 'Fichier invalide',
      input: {
        data: {
          httpStatus: 400,
          zodError: { errors: [], properties: { files: { errors: [], items: [{ errors: ['Fichier invalide'] }] } } },
        },
        message: '[]',
      },
      label: 'erreur zod tRPC dans un tableau → message de l’élément',
    },
    {
      expectedOutput: 'Invalid input',
      input: { data: { httpStatus: 400, zodError: { errors: ['Invalid input'] } }, message: '[]' },
      label: 'erreur zod tRPC à la racine → message racine',
    },
    {
      expectedOutput: 'Réseau introuvable',
      input: { data: { code: 'BAD_REQUEST', httpStatus: 400 }, message: 'Réseau introuvable' },
      label: 'erreur tRPC 400 métier → message tel quel',
    },
    {
      expectedOutput: undefined,
      input: { data: { code: 'FORBIDDEN', httpStatus: 403 }, message: 'Permissions invalides' },
      label: 'erreur tRPC 403 → aucun message (générique + détail)',
    },
    {
      expectedOutput: undefined,
      input: { data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }, message: 'connection refused' },
      label: 'erreur tRPC 5xx → aucun message (générique + détail)',
    },
    {
      expectedOutput: 'Paramètres incorrects',
      input: { message: 'Paramètres incorrects', status: 400 },
      label: 'FetchError 400 → message du serveur',
    },
    {
      expectedOutput: undefined,
      input: { message: 'Trop de requêtes, veuillez réessayer plus tard.', status: 429 },
      label: 'FetchError 429 → aucun message (générique + détail)',
    },
    {
      expectedOutput: undefined,
      input: { message: 'Failed to load data for /api/x (status 502)', status: 502 },
      label: 'FetchError 5xx → aucun message (générique + détail)',
    },
    {
      expectedOutput: 'Veuillez choisir un réseau',
      input: new Error('Veuillez choisir un réseau'),
      label: 'erreur levée côté client → son message',
    },
    {
      expectedOutput: undefined,
      input: new TypeError('Failed to fetch'),
      label: 'échec réseau (fetch) → aucun message (générique + détail)',
    },
    {
      expectedOutput: undefined,
      input: Object.assign(new Error('Failed to fetch'), { cause: new TypeError('Failed to fetch') }),
      label: 'échec réseau enveloppé par tRPC → aucun message (générique + détail)',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(getUserFacingErrorMessage(input)).toStrictEqual(expectedOutput);
  });
});
