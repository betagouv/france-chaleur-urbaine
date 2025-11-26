import { upperCaseFirstChar } from '@/utils/strings';
import Tag from './Tag';

type ModeDeChauffageProps = {
  modeDeChauffage?: string | null;
  typeDeChauffage?: string | null;
};

export const getModeDeChauffageDisplay = ({ modeDeChauffage, typeDeChauffage }: ModeDeChauffageProps): string | null => {
  const mode = modeDeChauffage?.toLowerCase()?.trim();
  if (mode && ['gaz', 'fioul', 'électricité'].includes(mode)) {
    return `${upperCaseFirstChar(mode)} ${typeDeChauffage ? typeDeChauffage.toLowerCase() : ''}`;
  }
  return typeDeChauffage || null;
};

const ModeDeChauffageTag = ({ modeDeChauffage, typeDeChauffage }: ModeDeChauffageProps) => {
  const displayText = getModeDeChauffageDisplay({ modeDeChauffage, typeDeChauffage });
  return <Tag text={displayText} />;
};

export default ModeDeChauffageTag;
