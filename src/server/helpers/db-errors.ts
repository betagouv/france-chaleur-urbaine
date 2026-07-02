// Erreurs DB exposables à l'UI — détection + message, partagés par les deux pipelines d'erreurs
// (routes REST `handleRouteErrors` et middleware tRPC `db-errors`). Volontairement générique : pas de
// mapping par contrainte (un détail d'implémentation), un seul message suffit, l'UI fournit le contexte.

/** Violation d'unicité Postgres (SQLSTATE 23505) : valeur déjà existante. */
export const isUniqueViolation = (error: unknown): boolean => (error as { code?: string } | null)?.code === '23505';

export const UNIQUE_VIOLATION_MESSAGE = 'Cette entrée existe déjà';
