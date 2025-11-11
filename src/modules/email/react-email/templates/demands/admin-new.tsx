import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { dayjs } from '@/utils/date';
import { Layout, Link, Note, Table, TableColumn, TableRow, Text, Title } from '../../components';
import { demand as demandData } from './_data';

const DemandAdminNewEmail = ({ demand }: { demand: AirtableLegacyRecord }) => {
  return (
    <Layout>
      <Title>Nouvelle demande de contact reçue</Title>

      <Text>Une nouvelle demande de contact a été créée sur France Chaleur Urbaine avec les informations suivantes :</Text>
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
          <TableColumn style={{ fontWeight: 'bold' }}>Téléphone</TableColumn>
          <TableColumn>{demand.Téléphone || 'Non renseigné'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Email</TableColumn>
          <TableColumn>
            <Link href={`mailto:${demand.Mail}`}>{demand.Mail}</Link>
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Distance au réseau</TableColumn>
          <TableColumn>
            {demand['Distance au réseau'] != null ? `${Math.round(demand['Distance au réseau'])} m` : 'Non calculée'}
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Type de bâtiment</TableColumn>
          <TableColumn>{demand.Établissement}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Date de la demande</TableColumn>
          <TableColumn>{dayjs(demand['Date de la demande']).format('DD/MM/YYYY') || 'Non renseignée'}</TableColumn>
        </TableRow>

        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Comment a connu FCU</TableColumn>
          <TableColumn>
            {!demand.Sondage || demand.Sondage?.length === 0
              ? 'Non renseigné'
              : typeof demand.Sondage === 'string'
                ? demand.Sondage
                : demand.Sondage?.join(', ')}
          </TableColumn>
        </TableRow>
      </Table>

      <Note>Cette demande a été automatiquement générée par le système France Chaleur Urbaine.</Note>
    </Layout>
  );
};

DemandAdminNewEmail.PreviewProps = { demand: demandData };

export default DemandAdminNewEmail;
