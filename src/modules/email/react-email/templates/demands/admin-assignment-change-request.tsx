import { Layout, Link, Table, TableColumn, TableRow, Text, Title } from '../../components';

type Props = {
  demandId: string;
  comment: string | null;
  requestedSncuId: string;
  requesterEmail: string;
};

const DemandAdminAssignmentChangeRequestEmail = ({ demandId, requestedSncuId, comment, requesterEmail }: Props) => {
  return (
    <Layout>
      <Title>Demande de réaffectation</Title>

      <Text>Un gestionnaire a demandé une réaffectation pour une demande de raccordement.</Text>

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
          <TableColumn>{comment}</TableColumn>
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

DemandAdminAssignmentChangeRequestEmail.PreviewProps = {
  comment: 'Le réseau actuellement attribué ne dessert pas cette zone.',
  demandId: 'abc123',
  requestedSncuId: '7501C',
  requesterEmail: 'collectivite@test.local',
} satisfies Props;

export default DemandAdminAssignmentChangeRequestEmail;
