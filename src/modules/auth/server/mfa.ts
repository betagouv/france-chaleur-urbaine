import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import { createUserEvent } from '@/modules/events/server/service';
import { serverConfig } from '@/server/config';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import type { UserRole } from '@/types/enum/UserRole';

/**
 * Second factor (TOTP, authenticator app) required from admins on top of their password.
 * The secret is stored on `users.totp_secret`, encrypted with `ADMIN_MFA_ENCRYPTION_KEY`: this protects a leaked dump or
 * backup, not a compromised runtime (the key lives next to the other secrets of the environment).
 * A secret without `totp_enrolled_at` is a pending enrollment. Enabled when the key is set (mandatory on deployed environments).
 */

export const MFA_INVALID_CODE_MESSAGE = 'Code incorrect ou déjà utilisé. Saisissez le code actuel de votre application.';
export const MFA_LOCKED_MESSAGE = `Trop de codes incorrects. Réessayez dans ${businessRules.adminMfaLockMinutes.display}.`;
const MFA_ISSUER = 'France Chaleur Urbaine';
const TOTP_PERIOD_SECONDS = 30;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_IV_BYTES = 12;

export const isAdminMfaEnabled = (): boolean => !!serverConfig.ADMIN_MFA_ENCRYPTION_KEY;

export const requiresMfa = (user: { role: UserRole }): boolean => isAdminMfaEnabled() && user.role === 'admin';

/**
 * A second-factor check stays valid for `adminMfaValidityHours` on the browser that performed it (carried by the JWT).
 */
export const isMfaVerificationFresh = (mfaVerifiedAt: number | undefined, now: number = Date.now()): boolean =>
  mfaVerifiedAt !== undefined && now - mfaVerifiedAt < businessRules.adminMfaValidityHours.value * 60 * 60 * 1000;

/**
 * AES-256-GCM, output `iv.ciphertext.tag` in base64. The key is a base64 32-byte string.
 */
export const encryptSecret = (plainText: string, base64Key: string): string => {
  const iv = randomBytes(ENCRYPTION_IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, decodeKey(base64Key), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return [iv, encrypted, cipher.getAuthTag()].map((part) => part.toString('base64')).join('.');
};

export const decryptSecret = (encoded: string, base64Key: string): string => {
  const [iv, encrypted, authTag] = encoded.split('.').map((part) => Buffer.from(part, 'base64'));
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, decodeKey(base64Key), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};

const decodeKey = (base64Key: string): Buffer => {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('ADMIN_MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return key;
};

const getEncryptionKey = (): string => {
  if (!serverConfig.ADMIN_MFA_ENCRYPTION_KEY) {
    throw new Error('ADMIN_MFA_ENCRYPTION_KEY is not configured');
  }
  return serverConfig.ADMIN_MFA_ENCRYPTION_KEY;
};

export type MfaEnrollment = {
  /** base32 secret for manual entry when the QR code cannot be scanned */
  secret: string;
  qrCodeDataUrl: string;
};

/**
 * Enrollment state of a user: `null` once the second factor is confirmed, otherwise the pending secret to scan
 * (reused across page loads so that two open tabs show the same QR code).
 */
export const getMfaEnrollment = async (userId: string): Promise<MfaEnrollment | null> => {
  const user = await kdb
    .selectFrom('users')
    .select(['email', 'totp_secret', 'totp_enrolled_at'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();
  if (user.totp_enrolled_at) {
    return null;
  }

  const key = getEncryptionKey();
  const secret = user.totp_secret ? decryptSecret(user.totp_secret, key) : await createPendingSecret(userId, key);
  const otpauthUri = generateURI({ issuer: MFA_ISSUER, label: user.email, secret });
  return { qrCodeDataUrl: await QRCode.toDataURL(otpauthUri), secret };
};

const createPendingSecret = async (userId: string, key: string): Promise<string> => {
  const secret = generateSecret();
  await kdb
    .updateTable('users')
    .set({ totp_enrolled_at: null, totp_last_used_step: null, totp_secret: encryptSecret(secret, key) })
    .where('id', '=', userId)
    .execute();
  return secret;
};

/**
 * Checks a 6-digit code for the user; the first valid code confirms a pending enrollment (notified by email).
 * Consecutive wrong codes lock the check for `adminMfaLockMinutes` after `adminMfaFailedAttemptsLimit` failures.
 * Each accepted time step is claimed by a conditional update, so a code cannot be replayed, even by concurrent requests.
 * Throws a user-facing error on failure.
 */
export const verifyMfaCode = async (userId: string, code: string) => {
  const user = await kdb
    .selectFrom('users')
    .select([
      'id',
      'email',
      'role',
      'active',
      'totp_secret',
      'totp_enrolled_at',
      'totp_last_used_step',
      'totp_failed_attempts',
      'totp_locked_until',
    ])
    .where('id', '=', userId)
    .where('active', 'is', true)
    .executeTakeFirst();
  if (!user?.totp_secret) {
    logger.warn('mfa check failed', { reason: 'no_secret', user_id: userId });
    throw new Error(MFA_INVALID_CODE_MESSAGE);
  }
  const now = new Date();
  if (user.totp_locked_until && user.totp_locked_until > now) {
    logger.warn('mfa check failed', { reason: 'locked', user_id: userId });
    throw new Error(MFA_LOCKED_MESSAGE);
  }

  const result = await verify({
    afterTimeStep: user.totp_last_used_step === null ? undefined : Number(user.totp_last_used_step),
    epochTolerance: TOTP_PERIOD_SECONDS, // one period before and after, absorbs clock drift of the phone
    secret: decryptSecret(user.totp_secret, getEncryptionKey()),
    token: code,
  });
  if (!result.valid || !('timeStep' in result)) {
    // the functional API is typed for HOTP too: `timeStep` only exists on a TOTP result
    await recordFailedAttempt(user, now);
    throw new Error(MFA_INVALID_CODE_MESSAGE);
  }

  const isEnrollment = user.totp_enrolled_at === null;
  const claimed = await kdb
    .updateTable('users')
    .set({
      totp_failed_attempts: 0,
      totp_last_used_step: result.timeStep,
      totp_locked_until: null,
      ...(isEnrollment ? { totp_enrolled_at: now } : {}),
    })
    .where('id', '=', userId)
    .where((eb) => eb.or([eb('totp_last_used_step', 'is', null), eb('totp_last_used_step', '<', String(result.timeStep))]))
    .executeTakeFirst();
  if (Number(claimed.numUpdatedRows) === 0) {
    logger.warn('mfa check failed', { reason: 'concurrent_replay', user_id: userId });
    throw new Error(MFA_INVALID_CODE_MESSAGE);
  }

  if (isEnrollment) {
    logger.info('mfa enrolled', { user_id: userId });
    await createUserEvent({ author_id: userId, context_id: userId, context_type: 'user', type: 'user_mfa_enrolled' });
    sendEmailTemplate('auth.utilisateur.double-authentification-activee', user).catch((error) =>
      logger.error('mfa enrollment email failed', { error, user_id: userId })
    );
  }
  return { active: user.active, email: user.email, id: user.id, role: user.role };
};

const recordFailedAttempt = async (user: { id: string; totp_failed_attempts: number }, now: Date) => {
  const failedAttempts = user.totp_failed_attempts + 1;
  const locked = failedAttempts >= businessRules.adminMfaFailedAttemptsLimit.value;
  await kdb
    .updateTable('users')
    .set({
      totp_failed_attempts: locked ? 0 : failedAttempts,
      totp_locked_until: locked ? new Date(now.getTime() + businessRules.adminMfaLockMinutes.value * 60 * 1000) : null,
    })
    .where('id', '=', user.id)
    .execute();
  logger.warn('mfa check failed', { failed_attempts: failedAttempts, locked, reason: 'invalid_code', user_id: user.id });
  await createUserEvent({ author_id: user.id, context_id: user.id, context_type: 'user', data: { locked }, type: 'user_mfa_failed' });
};

/**
 * Admin action: drops the second factor of a user (lost phone), a fresh enrollment is required at their next login.
 * The target is notified by email so that an unwanted reset gets noticed.
 */
export const resetUserMfa = async (targetUserId: string, adminId: string) => {
  const target = await kdb
    .updateTable('users')
    .set({ totp_enrolled_at: null, totp_failed_attempts: 0, totp_last_used_step: null, totp_locked_until: null, totp_secret: null })
    .where('id', '=', targetUserId)
    .returning(['id', 'email'])
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' }));
  logger.warn('mfa reset by admin', { admin_id: adminId, target_user_id: targetUserId });
  await createUserEvent({
    author_id: adminId,
    context_id: targetUserId,
    context_type: 'user',
    data: { user_email: target.email },
    type: 'user_mfa_reset',
  });
  sendEmailTemplate('auth.utilisateur.double-authentification-reinitialisee', target).catch((error) =>
    logger.error('mfa reset email failed', { error, user_id: targetUserId })
  );
};
