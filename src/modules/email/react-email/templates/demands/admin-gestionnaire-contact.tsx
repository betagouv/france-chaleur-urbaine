import { clientConfig } from '@/client-config';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { dayjs } from '@/utils/date';

import { Button, Layout, Link, Table, TableColumn, TableRow, Text, Title } from '../../components';
import { demand as demandData } from './_data';

const DemandAdminGestionnaireContactEmail = ({ demand }: { demand: AirtableLegacyRecord }) => {
  return (
    <Layout>
      <Title>Nouveau message HP à traiter</Title>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Informations du HP</Text>

      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Région</TableColumn>
          <TableColumn>{demand.Region || 'Non renseigné'}</TableColumn>
        </TableRow>
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
          <TableColumn style={{ fontWeight: 'bold' }}>Mode de chauffage</TableColumn>
          <TableColumn>{demand['Mode de chauffage'] || 'Non renseigné'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Date de la demande</TableColumn>
          <TableColumn>{dayjs(demand['Date de la demande']).format('DD/MM/YYYY') || 'Non renseignée'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Distance au réseau</TableColumn>
          <TableColumn>
            {demand['Distance au réseau'] != null ? `${Math.round(demand['Distance au réseau'])} m` : 'Non calculée'}
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Type de chauffage</TableColumn>
          <TableColumn>{demand['Type de chauffage'] || 'Non renseigné'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>PDP</TableColumn>
          <TableColumn>{demand['en PDP'] || 'Non'}</TableColumn>
        </TableRow>
      </Table>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '24px' }}>Côté espace gestionnaire</Text>

      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Prise de contact</TableColumn>
          <TableColumn>{demand['Prise de contact'] ? 'Oui' : 'Non'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Status</TableColumn>
          <TableColumn>{demand.Status || 'Non renseigné'}</TableColumn>
        </TableRow>
      </Table>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Button href={`${clientConfig.websiteUrl}/admin/demandes`}>Accéder aux demandes</Button>
      </div>
    </Layout>
  );
};

DemandAdminGestionnaireContactEmail.PreviewProps = { demand: demandData };

export default DemandAdminGestionnaireContactEmail;
