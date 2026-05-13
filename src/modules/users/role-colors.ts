import type { UserRole } from '@/types/enum/UserRole';

/**
 * Classes Tailwind pour l'identité couleur d'un rôle (bg + texte).
 * Postfix `!` (important) pour surcharger les styles par défaut du `<Badge>` DSFR.
 * Inoffensif sur un `<span>` plat sans conflit de spécificité.
 */
export const roleBadgeClasses: Record<UserRole, string> = {
  admin: 'bg-destructive! text-white!',
  alec: 'bg-teal-600! text-white!',
  ccrt: 'bg-pink-600! text-white!',
  collectivite: 'bg-orange-600! text-white!',
  gestionnaire: 'bg-purple-700! text-white!',
  particulier: 'bg-[#2ca892]! text-white!',
  professionnel: 'bg-[#0d49fb]! text-white!',
};
