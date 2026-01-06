import { describe, expect, it } from 'vitest';

import type { TestCase, TestCaseBoolean } from '@/tests/trpc-helpers';

import { zBatchDemandAddressSchema, zBatchDemandStep1Schema, zContactFormCreateDemandInput, zCreateBatchDemandInput } from './constants';

describe('zContactFormCreateDemandInput', () => {
  const validBaseInput = {
    email: 'test@example.com',
    firstName: 'Jean',
    heatingEnergy: 'gaz',
    lastName: 'Dupont',
    structure: 'Copropriété',
    termOfUse: true,
  };

  describe('champs obligatoires', () => {
    const testCases: TestCase<any, boolean>[] = [
      {
        expectedOutput: true,
        input: validBaseInput,
        label: 'valide une entrée minimale valide',
      },
      {
        expectedOutput: false,
        input: (() => {
          const { email: _, ...input } = validBaseInput;
          return input;
        })(),
        label: 'rejette sans email',
      },
      {
        expectedOutput: false,
        input: { ...validBaseInput, email: 'invalid' },
        label: 'rejette avec un email invalide',
      },
      {
        expectedOutput: false,
        input: { ...validBaseInput, firstName: '' },
        label: 'rejette sans prénom',
      },
      {
        expectedOutput: false,
        input: { ...validBaseInput, lastName: '' },
        label: 'rejette sans nom',
      },
      {
        expectedOutput: false,
        input: { ...validBaseInput, structure: '' },
        label: 'rejette sans structure',
      },
      {
        expectedOutput: false,
        input: { ...validBaseInput, termOfUse: false },
        label: 'rejette sans acceptation des CGU',
      },
      {
        expectedOutput: false,
        input: { ...validBaseInput, heatingEnergy: 'Charbon' },
        label: 'rejette avec une énergie de chauffage invalide',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const result = zContactFormCreateDemandInput.safeParse(input);
      expect(result.success).toBe(expectedOutput);
    });
  });

  describe('validation du téléphone', () => {
    const testCases: TestCaseBoolean<string>[] = [
      { expectedOutput: true, input: '0612345678' },
      { expectedOutput: true, input: '+33612345678' },
      { expectedOutput: true, input: '0033612345678' },
      { expectedOutput: true, input: '' },
      { expectedOutput: false, input: '123' },
      { expectedOutput: false, input: 'abc' },
      { expectedOutput: false, input: '06 12 34 56 78' },
      { expectedOutput: false, input: '06123456789' },
    ];

    testCases.forEach(({ input, expectedOutput }) => {
      it(expectedOutput ? `accepte le format "${input || '(vide)'}"` : `rejette le format invalide "${input}"`, () => {
        const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, phone: input });
        expect(result.success).toBe(expectedOutput);
      });
    });
  });

  describe('validation conditionnelle pour Tertiaire', () => {
    const tertiaryInput = {
      ...validBaseInput,
      structure: 'Tertiaire',
    };

    type TertiaryTestCase = TestCase<any, { success: boolean; missingField?: string }>;

    const testCases: TertiaryTestCase[] = [
      {
        expectedOutput: { missingField: 'companyType', success: false },
        input: tertiaryInput,
        label: 'rejette sans companyType pour structure Tertiaire',
      },
      {
        expectedOutput: { missingField: 'company', success: false },
        input: {
          ...tertiaryInput,
          companyType: 'Syndic de copropriété',
        },
        label: 'rejette sans company pour structure Tertiaire',
      },
      {
        expectedOutput: { success: true },
        input: {
          ...tertiaryInput,
          company: 'Ma Société',
          companyType: 'Syndic de copropriété',
        },
        label: 'valide avec companyType et company pour Tertiaire',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const result = zContactFormCreateDemandInput.safeParse(input);
      expect(result.success).toBe(expectedOutput.success);
      if (!result.success && expectedOutput.missingField) {
        expect(result.error.issues.some((i) => i.path.includes(expectedOutput.missingField!))).toBe(true);
      }
    });
  });

  describe("validation conditionnelle pour Bureau d'études", () => {
    const bureauEtudesInput = {
      ...validBaseInput,
      company: 'Mon Bureau',
      companyType: "Bureau d'études ou AMO",
      structure: 'Tertiaire',
    };

    type BureauEtudesTestCase = TestCase<any, { success: boolean; missingField?: string }>;

    const testCases: BureauEtudesTestCase[] = [
      {
        expectedOutput: { missingField: 'demandCompanyType', success: false },
        input: bureauEtudesInput,
        label: "rejette sans demandCompanyType pour Bureau d'études",
      },
      {
        expectedOutput: { success: true },
        input: {
          ...bureauEtudesInput,
          demandCompanyType: 'Copropriété',
        },
        label: 'valide avec demandCompanyType Copropriété (pas besoin de demandCompanyName)',
      },
      {
        expectedOutput: { missingField: 'demandCompanyName', success: false },
        input: {
          ...bureauEtudesInput,
          demandCompanyType: 'Bâtiment tertiaire',
        },
        label: 'rejette sans demandCompanyName pour Bâtiment tertiaire',
      },
      {
        expectedOutput: { success: true },
        input: {
          ...bureauEtudesInput,
          demandCompanyName: 'Client SA',
          demandCompanyType: 'Bâtiment tertiaire',
        },
        label: 'valide avec demandCompanyType et demandCompanyName pour Bâtiment tertiaire',
      },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      const result = zContactFormCreateDemandInput.safeParse(input);
      expect(result.success).toBe(expectedOutput.success);
      if (!result.success && expectedOutput.missingField) {
        expect(result.error.issues.some((i) => i.path.includes(expectedOutput.missingField!))).toBe(true);
      }
    });
  });
});

describe('zBatchDemandStep1Schema', () => {
  const validInput = {
    email: 'test@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    structure: 'Copropriété',
    termOfUse: true,
  };

  type BatchStep1TestCase = TestCase<any, { success: boolean; missingField?: string }>;

  const testCases: BatchStep1TestCase[] = [
    {
      expectedOutput: { success: true },
      input: validInput,
      label: 'valide une entrée valide',
    },
    {
      expectedOutput: { success: false },
      input: { ...validInput, termOfUse: false },
      label: 'rejette sans acceptation des CGU',
    },
    {
      expectedOutput: { missingField: 'companyType', success: false },
      input: { ...validInput, structure: 'Tertiaire' },
      label: 'requiert companyType pour structure Tertiaire',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    const result = zBatchDemandStep1Schema.safeParse(input);
    expect(result.success).toBe(expectedOutput.success);
    if (!result.success && expectedOutput.missingField) {
      expect(result.error.issues.some((i) => i.path.includes(expectedOutput.missingField!))).toBe(true);
    }
  });
});

describe('zBatchDemandAddressSchema', () => {
  const testCases: TestCase<any, boolean>[] = [
    {
      expectedOutput: true,
      input: {
        addressId: 'abc123',
        heatingEnergy: 'gaz',
        heatingType: 'collectif',
      },
      label: 'valide une adresse valide',
    },
    {
      expectedOutput: false,
      input: {
        addressId: 'abc123',
        heatingEnergy: 'charbon',
        heatingType: 'collectif',
      },
      label: 'rejette une énergie de chauffage invalide',
    },
    {
      expectedOutput: false,
      input: {
        addressId: 'abc123',
        heatingEnergy: 'gaz',
        heatingType: 'mixte',
      },
      label: 'rejette un type de chauffage invalide',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    const result = zBatchDemandAddressSchema.safeParse(input);
    expect(result.success).toBe(expectedOutput);
  });
});

describe('zCreateBatchDemandInput', () => {
  const validAddress = {
    addressId: 'abc123',
    heatingEnergy: 'gaz' as const,
    heatingType: 'collectif' as const,
  };

  const testCases: TestCase<any, boolean>[] = [
    {
      expectedOutput: true,
      input: {
        addresses: [validAddress],
        termOfUse: true,
      },
      label: 'valide avec une adresse',
    },
    {
      expectedOutput: false,
      input: {
        addresses: [],
        termOfUse: true,
      },
      label: 'rejette sans adresse',
    },
    {
      expectedOutput: false,
      input: {
        addresses: Array.from({ length: 51 }, (_, i) => ({
          ...validAddress,
          addressId: `addr${i}`,
        })),
        termOfUse: true,
      },
      label: 'rejette avec plus de 50 adresses',
    },
    {
      expectedOutput: true,
      input: {
        addresses: Array.from({ length: 50 }, (_, i) => ({
          ...validAddress,
          addressId: `addr${i}`,
        })),
        termOfUse: true,
      },
      label: 'accepte exactement 50 adresses',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    const result = zCreateBatchDemandInput.safeParse(input);
    expect(result.success).toBe(expectedOutput);
  });
});
