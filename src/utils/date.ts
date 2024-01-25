/**
 * Formatte une date en string au format ISO jusqu'à la minute.
 * Exemple : 2024-01-25T16:48
 */
export function formatAsISODate(date: Date): string {
  return date.toISOString().slice(0, 16);
}
