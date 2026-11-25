import { TRPCError } from '@trpc/server';

import {
  isSelectableUnrealizableReason,
  isUnrealizableDetailValid,
  UNREALIZABLE_DETAIL_MIN_LENGTH,
  type UnrealizableReason,
} from '@/modules/demands/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

type UnrealizableReasonUpdate = {
  Status?: string;
  unrealizable_detail?: string | null;
  unrealizable_reason?: UnrealizableReason | null;
};

/**
 * Columns clearing the reason when the demand gets any status other than « Non réalisable »: the reason only lives with that status.
 * Used alone by the partner API, which changes statuses without sending a reason.
 */
export const resolveUnrealizableReasonReset = (nextStatus: string | undefined) =>
  nextStatus !== undefined && nextStatus !== DEMANDE_STATUS.UNREALISABLE ? { unrealizable_detail: null, unrealizable_reason: null } : {};

/**
 * Columns to write for an update made in the app: the reason is mandatory when the demand becomes « Non réalisable », and accepted only then.
 */
export const resolveUnrealizableReasonColumns = (currentStatus: string | undefined, values: UnrealizableReasonUpdate) => {
  const reason = values.unrealizable_reason ?? null;
  const isBecomingUnrealizable = values.Status === DEMANDE_STATUS.UNREALISABLE && currentStatus !== DEMANDE_STATUS.UNREALISABLE;

  if (!isBecomingUnrealizable) {
    if (reason) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le motif ne peut être renseigné qu’au passage en « Non réalisable ».' });
    }
    return resolveUnrealizableReasonReset(values.Status);
  }
  if (!reason || !isSelectableUnrealizableReason(reason)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Un motif est obligatoire pour classer une demande en « Non réalisable ».' });
  }
  const detail = values.unrealizable_detail ?? '';
  if (!isUnrealizableDetailValid(reason, detail)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Précisez le motif en au moins ${UNREALIZABLE_DETAIL_MIN_LENGTH} caractères.`,
    });
  }
  return { unrealizable_detail: detail || null, unrealizable_reason: reason };
};
