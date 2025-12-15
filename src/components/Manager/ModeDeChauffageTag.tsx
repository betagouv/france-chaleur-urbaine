import type { ModeDeChauffage, TypeDeChauffage } from '@/modules/demands/constants';
import Tag from './Tag';

type ModeDeChauffageProps = {
  modeDeChauffage?: ModeDeChauffage | null;
  typeDeChauffage?: TypeDeChauffage | null;
};

/**
 * Combine mode de chauffage et type de chauffage en un texte lisible.
 * Les valeurs sont déjà normalisées côté serveur dans augmentGestionnaireDemand.
 * Ex: "Gaz" + "Collectif" → "Gaz collectif"
 */
export const getModeDeChauffageDisplay = ({ modeDeChauffage, typeDeChauffage }: ModeDeChauffageProps): string | null => {
  // Si on a un mode de chauffage standard (pas "Autre / Je ne sais pas")
  if (modeDeChauffage && ['Électricité', 'Gaz', 'Fioul'].includes(modeDeChauffage)) {
    const typeDisplay = typeDeChauffage && typeDeChauffage !== 'Autre / Je ne sais pas' ? ` ${typeDeChauffage.toLowerCase()}` : '';
    return `${modeDeChauffage}${typeDisplay}`;
  }

  // Sinon, affiche juste le type de chauffage s'il existe et n'est pas "Autre"
  if (typeDeChauffage && typeDeChauffage !== 'Autre / Je ne sais pas') {
    return typeDeChauffage;
  }

  return null;
};

const ModeDeChauffageTag = ({ modeDeChauffage, typeDeChauffage }: ModeDeChauffageProps) => {
  const displayText = getModeDeChauffageDisplay({ modeDeChauffage, typeDeChauffage });
  return <Tag text={displayText} />;
};

export default ModeDeChauffageTag;
