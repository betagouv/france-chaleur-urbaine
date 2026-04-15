import { Layout, Link, Table, TableColumn, TableRow, Text, Title } from '../../components';

type Props = {
  demandId: string;
  reason: string;
  requestedSncuId: string;
  requesterEmail: string;
};

const DemandAdminNetworkChangeRequestEmail = ({ demandId, requestedSncuId, reason, requesterEmail }: Props) => {
  return (
    <Layout>
      <Title>Demande de changement de réseau</Title>

      <Text>Un utilisateur collectivité/ALEC a demandé un changement de réseau pour une demande de raccordement.</Text>

      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Demande</TableColumn>
          <TableColumn>{demandId}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Réseau demandé (SNCU)</TableColumn>
          <TableColumn>{requestedSncuId}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Motif</TableColumn>
          <TableColumn>{reason}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Demandé par</TableColumn>
          <TableColumn>
            <Link href={`mailto:${requesterEmail}`}>{requesterEmail}</Link>
          </TableColumn>
        </TableRow>
      </Table>

      <Text>
        Vous pouvez gérer cette demande depuis <Link href="/admin/demandes">l'interface d'administration</Link>.
      </Text>
    </Layout>
  );
};

DemandAdminNetworkChangeRequestEmail.PreviewProps = {
  demandId: 'abc123',
  reason: 'Le réseau actuellement attribué ne dessert pas cette zone.',
  requestedSncuId: '7501C',
  requesterEmail: 'collectivite@test.local',
};

export default DemandAdminNetworkChangeRequestEmail;
