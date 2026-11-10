export const solutionSections = [
  { icon: '😀', id: 'en-quelques-mots', title: 'En quelques mots' },
  { icon: '🔎', id: 'de-quoi-sagit-il', title: 'De quoi s’agit-il ?' },
  { icon: '⚙️', id: 'fonctionnement', title: 'Comment ça marche ?' },
  { icon: '🏠', id: 'conditions', title: 'Est-ce fait pour votre immeuble ?' },
  { icon: '⭐', id: 'avantages', title: 'Les principaux avantages' },
  { icon: '⚠️', id: 'vigilance', title: 'Les points à vérifier' },
  { icon: '🚀', id: 'etapes', title: 'Les étapes d’un projet' },
  { icon: '❓', id: 'questions', title: 'Questions fréquentes' },
  { icon: '💶', id: 'cout', title: 'Combien ça coûte ? Quelles aides possibles ?' },
  { icon: '', id: 'aides', title: 'Quelles aides possibles ?' },
  { icon: '👉', id: 'aller-plus-loin', title: 'Pour aller plus loin' },
] as const;

export type SolutionSectionId = (typeof solutionSections)[number]['id'];
export type SolutionBuildingLabel = 'immeuble' | 'logement' | 'maison';

export const getSolutionSection = (id: SolutionSectionId) => solutionSections.find((section) => section.id === id)!;

export const getSolutionSectionTitle = (id: SolutionSectionId, buildingLabel: SolutionBuildingLabel) =>
  id === 'conditions' ? `Est-ce fait pour votre ${buildingLabel} ?` : getSolutionSection(id).title;
