import { describe, expect, it } from 'vitest';

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
    it('valide une entrée minimale valide', () => {
      const result = zContactFormCreateDemandInput.safeParse(validBaseInput);
      expect(result.success).toBe(true);
    });

    it('rejette sans email', () => {
      const { email: _, ...input } = validBaseInput;
      const result = zContactFormCreateDemandInput.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejette avec un email invalide', () => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, email: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('rejette sans prénom', () => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('rejette sans nom', () => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('rejette sans structure', () => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, structure: '' });
      expect(result.success).toBe(false);
    });

    it('rejette sans acceptation des CGU', () => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, termOfUse: false });
      expect(result.success).toBe(false);
    });

    it('rejette avec une énergie de chauffage invalide', () => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, heatingEnergy: 'Charbon' });
      expect(result.success).toBe(false);
    });
  });

  describe('validation du téléphone', () => {
    it.each([['0612345678'], ['+33612345678'], ['0033612345678'], ['']])('accepte le format "%s"', (phone) => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, phone });
      expect(result.success).toBe(true);
    });

    it.each([
      ['123'],
      ['abc'],
      ['06 12 34 56 78'], // spaces not supported by regex
      ['06123456789'], // 11 digits
    ])('rejette le format invalide "%s"', (phone) => {
      const result = zContactFormCreateDemandInput.safeParse({ ...validBaseInput, phone });
      expect(result.success).toBe(false);
    });
  });

  describe('validation conditionnelle pour Tertiaire', () => {
    const tertiaryInput = {
      ...validBaseInput,
      structure: 'Tertiaire',
    };

    it('rejette sans companyType pour structure Tertiaire', () => {
      const result = zContactFormCreateDemandInput.safeParse(tertiaryInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('companyType'))).toBe(true);
      }
    });

    it('rejette sans company pour structure Tertiaire', () => {
      const result = zContactFormCreateDemandInput.safeParse({
        ...tertiaryInput,
        companyType: 'Syndic de copropriété',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('company'))).toBe(true);
      }
    });

    it('valide avec companyType et company pour Tertiaire', () => {
      const result = zContactFormCreateDemandInput.safeParse({
        ...tertiaryInput,
        company: 'Ma Société',
        companyType: 'Syndic de copropriété',
      });
      expect(result.success).toBe(true);
    });
  });

  describe("validation conditionnelle pour Bureau d'études", () => {
    const bureauEtudesInput = {
      ...validBaseInput,
      company: 'Mon Bureau',
      companyType: "Bureau d'études ou AMO",
      structure: 'Tertiaire',
    };

    it("rejette sans demandCompanyType pour Bureau d'études", () => {
      const result = zContactFormCreateDemandInput.safeParse(bureauEtudesInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('demandCompanyType'))).toBe(true);
      }
    });

    it('valide avec demandCompanyType Copropriété (pas besoin de demandCompanyName)', () => {
      const result = zContactFormCreateDemandInput.safeParse({
        ...bureauEtudesInput,
        demandCompanyType: 'Copropriété',
      });
      expect(result.success).toBe(true);
    });

    it('rejette sans demandCompanyName pour Bâtiment tertiaire', () => {
      const result = zContactFormCreateDemandInput.safeParse({
        ...bureauEtudesInput,
        demandCompanyType: 'Bâtiment tertiaire',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('demandCompanyName'))).toBe(true);
      }
    });

    it('valide avec demandCompanyType et demandCompanyName pour Bâtiment tertiaire', () => {
      const result = zContactFormCreateDemandInput.safeParse({
        ...bureauEtudesInput,
        demandCompanyName: 'Client SA',
        demandCompanyType: 'Bâtiment tertiaire',
      });
      expect(result.success).toBe(true);
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

  it('valide une entrée valide', () => {
    expect(zBatchDemandStep1Schema.safeParse(validInput).success).toBe(true);
  });

  it('rejette sans acceptation des CGU', () => {
    expect(zBatchDemandStep1Schema.safeParse({ ...validInput, termOfUse: false }).success).toBe(false);
  });

  it('requiert companyType pour structure Tertiaire', () => {
    const result = zBatchDemandStep1Schema.safeParse({ ...validInput, structure: 'Tertiaire' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('companyType'))).toBe(true);
    }
  });
});

describe('zBatchDemandAddressSchema', () => {
  it('valide une adresse valide', () => {
    const result = zBatchDemandAddressSchema.safeParse({
      addressId: 'abc123',
      heatingEnergy: 'gaz',
      heatingType: 'collectif',
    });
    expect(result.success).toBe(true);
  });

  it('rejette une énergie de chauffage invalide', () => {
    const result = zBatchDemandAddressSchema.safeParse({
      addressId: 'abc123',
      heatingEnergy: 'charbon',
      heatingType: 'collectif',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un type de chauffage invalide', () => {
    const result = zBatchDemandAddressSchema.safeParse({
      addressId: 'abc123',
      heatingEnergy: 'gaz',
      heatingType: 'mixte',
    });
    expect(result.success).toBe(false);
  });
});

describe('zCreateBatchDemandInput', () => {
  const validAddress = {
    addressId: 'abc123',
    heatingEnergy: 'gaz' as const,
    heatingType: 'collectif' as const,
  };

  it('valide avec une adresse', () => {
    const result = zCreateBatchDemandInput.safeParse({
      addresses: [validAddress],
      termOfUse: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejette sans adresse', () => {
    const result = zCreateBatchDemandInput.safeParse({
      addresses: [],
      termOfUse: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejette avec plus de 50 adresses', () => {
    const addresses = Array.from({ length: 51 }, (_, i) => ({
      ...validAddress,
      addressId: `addr${i}`,
    }));
    const result = zCreateBatchDemandInput.safeParse({
      addresses,
      termOfUse: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepte exactement 50 adresses', () => {
    const addresses = Array.from({ length: 50 }, (_, i) => ({
      ...validAddress,
      addressId: `addr${i}`,
    }));
    const result = zCreateBatchDemandInput.safeParse({
      addresses,
      termOfUse: true,
    });
    expect(result.success).toBe(true);
  });
});
