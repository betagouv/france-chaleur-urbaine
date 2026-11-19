import { createContext } from 'react';

import type { SolutionBuildingLabel } from '../article-sections';

export const SolutionBuildingContext = createContext<SolutionBuildingLabel>('immeuble');
