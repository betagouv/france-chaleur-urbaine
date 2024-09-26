import styled from 'styled-components';

import Box from '@components/ui/Box';
import Text from '@components/ui/Text';

const IsClassedTag = styled(Box)`
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
  margin-top: 16px;
`;

const NetworkName = ({ name, isClassed }: { name: string; isClassed: boolean }) => {
  return (
    <Box className="fr-m-1w">
      {isClassed && <IsClassedTag>RÉSEAU CLASSÉ</IsClassedTag>}
      <Name>{name}</Name>
    </Box>
  );
};

export default NetworkName;
