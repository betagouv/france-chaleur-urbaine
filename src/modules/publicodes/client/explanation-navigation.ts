import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { createContext } from 'react';

/**
 * Navigation callback provided by RuleExplanationDialog: when present, rule rows
 * display an "open" button that replaces the dialog content with that rule.
 */
export const ExplanationNavigationContext = createContext<((dottedName: RuleName) => void) | null>(null);
