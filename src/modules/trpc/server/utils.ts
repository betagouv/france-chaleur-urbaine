import { TRPCError } from '@trpc/server';

// Utility function for better error handling
export function throwIfNotFound(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: message || 'Not found',
    });
  }
}
