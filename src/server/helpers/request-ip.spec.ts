import { describe, expect, it } from 'vitest';

import { getClientIp } from './request-ip';

describe('getClientIp', () => {
  it('priorise X-Real-IP (posé par le routeur Scalingo, non spoofable)', () => {
    expect(getClientIp({ headers: { 'x-forwarded-for': '9.9.9.9', 'x-real-ip': '1.2.3.4' }, socket: { remoteAddress: '127.0.0.1' } })).toBe(
      '1.2.3.4'
    );
  });

  it('retombe sur X-Forwarded-For (première valeur) sans X-Real-IP', () => {
    expect(getClientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }, socket: { remoteAddress: '127.0.0.1' } })).toBe('9.9.9.9');
  });

  it('gère un header multi-valué (tableau)', () => {
    expect(getClientIp({ headers: { 'x-real-ip': ['1.2.3.4', '5.6.7.8'] } })).toBe('1.2.3.4');
  });

  it('retombe sur le socket sans header exploitable', () => {
    expect(getClientIp({ headers: {}, socket: { remoteAddress: '127.0.0.1' } })).toBe('127.0.0.1');
  });

  it('renvoie undefined si rien', () => {
    expect(getClientIp({ headers: {} })).toBeUndefined();
  });
});
