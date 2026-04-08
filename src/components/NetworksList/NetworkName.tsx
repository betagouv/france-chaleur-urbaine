import styled from 'styled-components';

import Box from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import type { EcoreseauLabel } from '@/modules/reseaux/types';

const IsClassedTag = styled(Text)`
  color: var(--text-default-info);
  background-color: var(--info-950-100);
  border-radius: 4px;
  padding: 4px;
  font-weight: bold;
  width: fit-content;
`;

const Name = styled(Text)`
  color: var(--text-action-high-blue-france);
  font-weight: bold;
  margin-top: 8px;
`;

const NetworkName = ({
  ecoreseau,
  name,
  isClassed,
  identifiant,
}: {
  ecoreseau?: EcoreseauLabel | null;
  name: string;
  isClassed: boolean;
  identifiant: string;
}) => {
  return (
    <Box className="fr-m-1w">
      {isClassed && (
        <IsClassedTag size="xs" mt="1w">
          RÉSEAU CLASSÉ
        </IsClassedTag>
      )}
      {ecoreseau && (
        <div className="mt-1 w-fit rounded bg-green-100 p-1 text-xs font-bold text-green-800">
          {ecoreseau === 'ecoreseau + 2025' ? 'LABEL ÉCORÉSEAU +' : 'LABEL ÉCORÉSEAU'}
        </div>
      )}
      <Name>
        <Link href={`/reseaux/${identifiant}`} isExternal>
          {name}
        </Link>
      </Name>
    </Box>
  );
};

export default NetworkName;
