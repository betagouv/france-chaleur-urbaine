import styled from 'styled-components';

import Box from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';

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

const NetworkName = ({ name, isClassed, identifiant }: { name: string; isClassed: boolean; identifiant: string }) => {
  return (
    <Box className="fr-m-1w">
      {isClassed && (
        <IsClassedTag size="xs" mt="1w">
          RÉSEAU CLASSÉ
        </IsClassedTag>
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
