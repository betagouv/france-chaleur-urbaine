import type { DemandeChaleurRenouvelable, DemandeChaleurRenouvelableStatus } from '@/modules/chaleur-renouvelable/constants';
import { typeLogementOptions, typeRadiateurOptions } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Link, Note, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const NouvelleDemandeChaleurRenouvelable = ({
  demand,
  demandId,
  status,
}: {
  demand: DemandeChaleurRenouvelable;
  demandId: string;
  status: DemandeChaleurRenouvelableStatus;
}) => {
  return (
    <Layout>
      <Title>Nouvelle demande chaleur renouvelable à traiter</Title>

      <Text>
        Une nouvelle demande a été déposée depuis le parcours chaleur renouvelable. Elle est disponible dans l'espace gestionnaire pour
        traitement.
      </Text>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Synthèse</Text>
      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Statut</TableColumn>
          <TableColumn>{status}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Demande</TableColumn>
          <TableColumn>{demandId}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Adresse</TableColumn>
          <TableColumn>{demand.address || 'Non renseignée'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Profil</TableColumn>
          <TableColumn>{demand.occupantStatus}</TableColumn>
        </TableRow>
        {demand.organizationName && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Structure</TableColumn>
            <TableColumn>{demand.organizationName}</TableColumn>
          </TableRow>
        )}
        {demand.demandConcern && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Demande concernant</TableColumn>
            <TableColumn>{demand.demandConcern}</TableColumn>
          </TableRow>
        )}
      </Table>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Contact</Text>
      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Nom</TableColumn>
          <TableColumn>{demand.lastName}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Prénom</TableColumn>
          <TableColumn>{demand.firstName}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Email</TableColumn>
          <TableColumn>
            <Link href={`mailto:${demand.email}`}>{demand.email}</Link>
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Téléphone</TableColumn>
          <TableColumn>{demand.phone || 'Non renseigné'}</TableColumn>
        </TableRow>
      </Table>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Projet</Text>
      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Type de logement</TableColumn>
          <TableColumn>
            {typeLogementOptions.find((option) => option.value === demand.housingType)?.label ?? demand.housingType}
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Nombre de logements</TableColumn>
          <TableColumn>{demand.housingCount}</TableColumn>
        </TableRow>
        {demand.surfaceArea !== null && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Surface</TableColumn>
            <TableColumn>{demand.surfaceArea} m²</TableColumn>
          </TableRow>
        )}
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Énergie de chauffage</TableColumn>
          <TableColumn>{demand.heatingEnergy}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Radiateurs</TableColumn>
          <TableColumn>{typeRadiateurOptions.find((option) => option.value === demand.radiatorType)?.label ?? 'Non renseigné'}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Étapes du projet</TableColumn>
          <TableColumn>{demand.projectStatus.length > 0 ? demand.projectStatus.join(', ') : 'Non renseigné'}</TableColumn>
        </TableRow>
        {demand.comments && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Commentaires</TableColumn>
            <TableColumn>{demand.comments}</TableColumn>
          </TableRow>
        )}
      </Table>

      <Section style={{ paddingTop: '24px', textAlign: 'center' }}>
        <Button href="/admin/demandes-chaleur-renouvelable" campaign="demands.equipe-fcu.nouvelle-demande-chaleur-renouvelable">
          Accéder à l'espace gestionnaire
        </Button>
      </Section>

      <Note>Cette notification est envoyée automatiquement à la création d'une demande chaleur renouvelable.</Note>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof NouvelleDemandeChaleurRenouvelable>({
  defaut: {
    label: 'Nouvelle demande chaleur renouvelable',
    props: {
      demand: {
        address: '10 rue du Test, 75001 Paris',
        averageArea: 70,
        averageResidents: 2,
        batimentConstructionId: 'CONSTRUCTION-123',
        comments: 'Le projet doit être traité avant la prochaine assemblée générale.',
        demandConcern: 'Une copropriété',
        dpe: 'C',
        email: 'claire.test@example.com',
        firstName: 'Claire',
        heatingEnergy: 'Gaz',
        hotWaterSystemType: 'Collectif',
        housingCount: 18,
        housingType: 'immeuble_chauffage_collectif',
        isPublicAdvisorSelected: true,
        lastName: 'Test',
        occupantStatus: 'Syndicat de copropriété',
        organizationName: 'Syndicat test',
        outdoorSpace: 'shared',
        phone: '0605040302',
        projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: 'Il y a moins de 3 mois',
        refusalReason: 'Coût du raccordement trop élevé',
        simulationUrl: 'https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable/resultat',
        surfaceArea: null,
      },
      demandId: 'demand-123',
      status: 'à traiter CCR',
    },
  },
});

export default NouvelleDemandeChaleurRenouvelable;
