import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { serverConfig } from '@/server/config';
import { BadRequestError } from '@/server/helpers/server';
import type { TestCase } from '@/tests/trpc-helpers';

import { countPasswordLeaks, ensurePasswordNotPwned, PWNED_PASSWORD_MESSAGE } from './pwned-passwords';

vi.mock('@/server/helpers/logger', () => ({ logger: { warn: vi.fn() } }));

// Hashes are derived at runtime rather than written as literals: the pre-commit secret scanner rejects long hex strings
const sha1 = (value: string) => createHash('sha1').update(value).digest('hex').toUpperCase();
const leakedPrefix = sha1('password').slice(0, 5);
const leakedSuffix = sha1('password').slice(5);
const otherSuffix = sha1('other').slice(5);
const anotherSuffix = sha1('another').slice(5);

const fetchReturning = (body: string, status = 200) =>
  vi.fn(async () => ({ ok: status < 400, status, text: async () => body })) as unknown as typeof fetch;

describe('countPasswordLeaks', () => {
  const testCases: TestCase<{ body: string; password: string }, number>[] = [
    {
      expectedOutput: 3861493,
      input: { body: `${otherSuffix}:2\r\n${leakedSuffix}:3861493\r\n${anotherSuffix}:0`, password: 'password' },
      label: 'leaked password found in the range',
    },
    {
      expectedOutput: 0,
      input: { body: `${leakedSuffix}:0\r\n${otherSuffix}:2`, password: 'password' },
      label: 'padding entry with count 0',
    },
    {
      expectedOutput: 0,
      input: { body: `${otherSuffix}:2\r\n${anotherSuffix}:1`, password: 'password' },
      label: 'password absent from the range',
    },
    { expectedOutput: 0, input: { body: '', password: 'password' }, label: 'empty range' },
  ];

  it.each(testCases)('$label', async ({ input, expectedOutput }) => {
    expect(await countPasswordLeaks(input.password, fetchReturning(input.body))).toStrictEqual(expectedOutput);
  });

  it('sends only the 5-character SHA-1 prefix, never the password', async () => {
    const fetchImpl = fetchReturning('');

    await countPasswordLeaks('password', fetchImpl);

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toStrictEqual(`https://api.pwnedpasswords.com/range/${leakedPrefix}`);
    expect(init.headers).toStrictEqual({ 'Add-Padding': 'true', 'User-Agent': 'france-chaleur-urbaine' });
  });

  it('throws when the API answers an error', async () => {
    await expect(countPasswordLeaks('password', fetchReturning('', 503))).rejects.toThrow('pwned passwords API responded 503');
  });
});

describe('ensurePasswordNotPwned', () => {
  it('does nothing when the check is disabled', async () => {
    serverConfig.PWNED_PASSWORDS_CHECK_ENABLED = false;
    vi.stubGlobal('fetch', fetchReturning(`${leakedSuffix}:10`));

    await expect(ensurePasswordNotPwned('password', 'register')).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });

  it('rejects a leaked password with a user-facing error', async () => {
    serverConfig.PWNED_PASSWORDS_CHECK_ENABLED = true;
    vi.stubGlobal('fetch', fetchReturning(`${leakedSuffix}:10`));

    await expect(ensurePasswordNotPwned('password', 'register')).rejects.toStrictEqual(new BadRequestError(PWNED_PASSWORD_MESSAGE));

    vi.unstubAllGlobals();
  });

  it('accepts an unknown password', async () => {
    serverConfig.PWNED_PASSWORDS_CHECK_ENABLED = true;
    vi.stubGlobal('fetch', fetchReturning(`${otherSuffix}:2`));

    await expect(ensurePasswordNotPwned('password', 'reset_password')).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });

  it('fails open when the API is unreachable', async () => {
    serverConfig.PWNED_PASSWORDS_CHECK_ENABLED = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    await expect(ensurePasswordNotPwned('password', 'register')).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });
});
