import { TRPCError } from '@trpc/server';

/**
 * Throws a TRPCError with code 'NOT_FOUND' if the given condition is falsy.
 * Useful for validating resource existence in API handlers.
 *
 * @param condition - The condition to check for resource existence.
 * @param message - Optional custom error message.
 * @throws {TRPCError} If the condition is falsy.
 */
export function throwIfNotFound(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: message || 'Not found',
    });
  }
}
