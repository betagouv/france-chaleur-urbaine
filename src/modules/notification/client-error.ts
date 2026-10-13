/** Shown for any error that is not a validation error, followed by the detailed message. */
export const genericErrorMessage = 'Une erreur est survenue, veuillez réessayer plus tard.';

/** First message of a zod error tree (`z.treeifyError`), whatever its depth. */
const getFirstZodError = (tree: any): string | undefined => {
  if (!tree || typeof tree !== 'object') {
    return undefined;
  }
  if (tree.errors?.[0]) {
    return tree.errors[0];
  }
  for (const child of [...Object.values(tree.properties ?? {}), ...(tree.items ?? [])]) {
    const message = getFirstZodError(child);
    if (message) {
      return message;
    }
  }
  return undefined;
};

/**
 * Message of an error meant to be shown to the user as is: the first issue of a tRPC input validation error, else
 * the message of a 400 response (REST `FetchError` or tRPC `BAD_REQUEST`: "Paramètres incorrects", business
 * checks…) or of an error raised by the client code (no status). `undefined` otherwise (401, 403, 404, 429, 5xx):
 * the generic message is shown, with the error message as detail.
 */
export const getUserFacingErrorMessage = (err: any): string | undefined => {
  const zodMessage = getFirstZodError(err?.data?.zodError);
  if (zodMessage) {
    return zodMessage;
  }
  const status: unknown = err?.status ?? err?.data?.httpStatus;
  // a failed fetch (network down, CORS…) is a TypeError, wrapped by tRPC as the cause of its error
  const isNetworkFailure = err instanceof TypeError || err?.cause instanceof TypeError;
  return !isNetworkFailure && (status === undefined || status === 400) ? err?.message || String(err) : undefined;
};
