/**
 * Formatte une date en string au format ISO jusqu'à la minute.
 * Exemple : 2024-01-25T16:48
 */
export function formatAsISODateMinutes(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/**
 * Formatte une date en string au format ISO uniquement pour la date.
 * Exemple : 2024-01-25
 */
export function formatAsISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Formate une date en format français (DD/MM/YYYY).
 *
 * @param {Date} date - La date à formater.
 * @returns {string} La date formatée en français.
 *
 * @example
 * ```tsx
 * formatFrenchDate(new Date()); // "11/02/2025"
 * ```
 */
export function formatFrenchDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formate une date en français avec l'heure (DD/MM/YYYY HH:MM).
 *
 * @param {Date} date - La date à formater.
 * @returns {string} La date et l'heure formatées en français.
 *
 * @example
 * ```tsx
 * formatFrenchDateTime(new Date()); // "11/02/2025, 14:30"
 * ```
 */
export function formatFrenchDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
