import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { Button, Layout, Link, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';
import { demand as demandData } from '@/modules/email/templates/demands/_data';
import { dayjs } from '@/utils/date';

const DemandeHautPotentiel = ({ demand }: { demand: AirtableLegacyRecord }) => {
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

      <Section style={{ paddingTop: '24px', textAlign: 'center' }}>
        <Button href="/admin/demandes" campaign="demands.equipe-fcu.demande-haut-potentiel">
          Accéder aux demandes
        </Button>
      </Section>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof DemandeHautPotentiel>({
  defaut: {
    label: "Nouveau message HP à traiter (envoyé à l'équipe FCU)",
    props: { demand: demandData },
  },
});

export default DemandeHautPotentiel;
