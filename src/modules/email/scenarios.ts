import type React from 'react';

/**
 * Un scénario : un jeu de props nommé, prêt à être affiché en prévisualisation
 * dans l'admin pour un template donné.
 */
type EmailScenario<C extends React.ComponentType<any>> = {
  label: string;
  props: React.ComponentProps<C>;
};

/**
 * Map de scénarios indexés par slug (utilisé dans l'URL et la config).
 */
export type EmailScenarios<C extends React.ComponentType<any>> = Record<string, EmailScenario<C>>;

/**
 * Helper utilisé dans chaque fichier de template pour déclarer les scénarios
 * (props pré-remplies pour la prévisualisation dans l'admin) en bénéficiant
 * d'un type-checking strict sur les props du composant cible.
 *
 * Usage : `export const scenarios = defineEmailScenarios<typeof MyEmail>({ ... });`
 *
 * Ce helper est isolé dans son propre fichier (et non dans `email.config.tsx`)
 * pour éviter une dépendance circulaire : la config importe les templates,
 * et les templates importent ce helper.
 */
export function defineEmailScenarios<C extends React.ComponentType<any>>(scenarios: EmailScenarios<C>): EmailScenarios<C> {
  return scenarios;
}
