import { describe, expect, it } from 'vitest';

import { businessRules } from '@/modules/app/business-rules';
import type { TestCase } from '@/tests/trpc-helpers';

import { decryptSecret, encryptSecret, isMfaVerificationFresh } from './mfa';

const key = Buffer.from('test-key-test-key-test-key-test!').toString('base64');

describe('mfa', () => {
  describe('encryptSecret / decryptSecret', () => {
    it('round-trips a secret with a random IV each time', () => {
      const first = encryptSecret('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', key);
      const second = encryptSecret('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', key);

      expect(first).not.toStrictEqual(second);
      expect(decryptSecret(first, key)).toStrictEqual('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP');
      expect(decryptSecret(second, key)).toStrictEqual('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP');
    });

    it('rejects a tampered ciphertext and a wrong key', () => {
      const encrypted = encryptSecret('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', key);
      const [iv, cipherText, tag] = encrypted.split('.');
      const tampered = [iv, Buffer.from('tampered-tampered-tampered-tamper').toString('base64'), tag].join('.');
      const otherKey = Buffer.from('other-key-other-key-other-key-ot').toString('base64');

      expect(() => decryptSecret(tampered, key)).toThrow();
      expect(() => decryptSecret(encrypted, otherKey)).toThrow();
    });

    it('refuses a key that is not 32 bytes', () => {
      expect(() => encryptSecret('secret', Buffer.from('short').toString('base64'))).toThrow('32-byte');
    });
  });

  describe('isMfaVerificationFresh', () => {
    const now = Date.parse('2026-10-30T12:00:00.000Z');
    const validityMs = businessRules.adminMfaValidityHours.value * 60 * 60 * 1000;
    const cases: TestCase<number | undefined, boolean>[] = [
      { expectedOutput: false, input: undefined, label: 'never verified → stale' },
      { expectedOutput: true, input: now, label: 'verified just now → fresh' },
      { expectedOutput: true, input: now - validityMs + 1, label: 'verified 1 ms before expiry → fresh' },
      { expectedOutput: false, input: now - validityMs, label: 'verified exactly at expiry → stale' },
      { expectedOutput: false, input: now - 30 * 24 * 60 * 60 * 1000, label: 'verified long ago → stale' },
    ];

    it.each(cases)('$label', ({ input, expectedOutput }) => {
      expect(isMfaVerificationFresh(input, now)).toStrictEqual(expectedOutput);
    });
  });
});
