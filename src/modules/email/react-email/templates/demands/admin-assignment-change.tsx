import type { AirtableLegacyRecord } from '@/modules/demands/types';

import { Layout, Link, Table, TableColumn, TableRow, Text, Title } from '../../components';
import { demand as demandData } from './_data';

const DemandAdminAssignmentChangeEmail = ({ demand, newAssignment }: { demand: AirtableLegacyRecord; newAssignment: string }) => {
  return (
    <Layout>
      <Title>Changement d'affectation</Title>

      <Text>Une demande a été réaffectée avec les informations suivantes :</Text>

      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Nom</TableColumn>
          <TableColumn>{demand.Nom}</TableColumn>
        </TableRow>
        {demand.Prénom && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Prénom</TableColumn>
            <TableColumn>{demand.Prénom}</TableColumn>
          </TableRow>
        )}
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Adresse</TableColumn>
          <TableColumn>{demand.Adresse}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Mail</TableColumn>
          <TableColumn>
            <Link href={`mailto:${demand.Mail}`}>{demand.Mail}</Link>
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Nouvelle affectation</TableColumn>
          <TableColumn>{newAssignment}</TableColumn>
        </TableRow>
      </Table>
    </Layout>
  );
};

DemandAdminAssignmentChangeEmail.PreviewProps = {
  demand: demandData,
  newAssignment: 'ENGIE',
};

export default DemandAdminAssignmentChangeEmail;
