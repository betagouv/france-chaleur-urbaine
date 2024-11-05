import Box from '@components/ui/Box';

const ColdNetwork = () => {
  return (
    <Box display="flex" alignItems="center" gap="8px">
      <img src="/icons/cold-network.svg" alt="" width={53} height={53} />
      <b>
        RÉSEAU
        <br />
        DE FROID
      </b>
    </Box>
  );
};

export default ColdNetwork;
