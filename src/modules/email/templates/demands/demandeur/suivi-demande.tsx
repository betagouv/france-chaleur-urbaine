import { demandeChaleurRenouvelableStatusDisplays } from '@/modules/chaleur-renouvelable/constants';
import type { DemandTrackingEmailRow } from '@/modules/demand-tracking/constants';
import { demandStatusDisplays } from '@/modules/demands/constants';
import { Button, Layout, Link, Note, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

const EMAIL_CAMPAIGN = 'demands.demandeur.suivi-demande';

type SuiviDemandeProps = {
  firstName: string | null;
  /** Open demands first, closed ones last (sorted by the service). */
  demands: DemandTrackingEmailRow[];
};

const headerCellStyle = { borderBottom: '1px solid #e3e3fd', fontSize: '13px', fontWeight: 'bold', padding: '6px 8px 6px 0' } as const;
const cellStyle = { borderBottom: '1px solid #e3e3fd', fontSize: '14px', padding: '8px 8px 8px 0' } as const;

const SuiviDemande = ({ firstName, demands }: SuiviDemandeProps) => (
  <Layout preview="Voici où en est votre demande sur France Chaleur Urbaine">
    <Text>Bonjour{firstName ? ` ${firstName}` : ''},</Text>
    <Text>Vous avez demandé à suivre l'avancement de votre demande sur France Chaleur Urbaine. Voici où elle en est aujourd'hui.</Text>
    {demands.length > 1 && <Text>Nous avons trouvé {demands.length} demandes associées à votre adresse email.</Text>}

    <Table style={{ borderCollapse: 'collapse', padding: 0 }}>
      <thead>
        <TableRow>
          <TableColumn style={headerCellStyle}>Adresse</TableColumn>
          <TableColumn style={headerCellStyle}>État de la demande</TableColumn>
          <TableColumn style={headerCellStyle}>Explication</TableColumn>
        </TableRow>
      </thead>
      <tbody>
        {demands.map((demand, index) => (
          <TableRow key={`${demand.address}-${index}`}>
            <TableColumn style={cellStyle}>{demand.address}</TableColumn>
            <TableColumn style={{ ...cellStyle, fontWeight: 'bold' }}>{demand.status.label}</TableColumn>
            <TableColumn style={cellStyle}>
              {demand.status.explanation}
              {demand.status.showCompareSolutionsLink && (
                <>
                  {' '}
                  <Link href="/chaleur-renouvelable" campaign={EMAIL_CAMPAIGN} content="comparer-solutions">
                    Comparer les solutions
                  </Link>
                </>
              )}
            </TableColumn>
          </TableRow>
        ))}
      </tbody>
    </Table>

    <Title style={{ fontSize: '16px', marginTop: '24px' }}>Vous n'avez pas été recontacté depuis plus d'un mois ?</Title>
    <Text>Écrivez-nous en précisant l'adresse concernée par votre demande.</Text>
    <Section style={{ padding: '8px 0 16px' }}>
      <Button href="/contact" campaign={EMAIL_CAMPAIGN} content="contact">
        Nous contacter
      </Button>
    </Section>

    <Text>Bien cordialement,</Text>
    <Text>L'équipe France Chaleur Urbaine</Text>
    <Note>
      Vous recevez cet email car un suivi a été demandé pour cette adresse sur france-chaleur-urbaine.beta.gouv.fr. Si vous n'êtes pas à
      l'origine de cette demande, vous pouvez ignorer ce message.
    </Note>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof SuiviDemande>({
  defaut: {
    label: 'Une demande de raccordement en attente',
    props: {
      demands: [
        {
          address: '12 Place du Capitole, 31000 Toulouse',
          status: demandStatusDisplays[DEMANDE_STATUS.TO_PROCESS],
          type: 'raccordement',
        },
      ],
      firstName: 'Marie',
    },
  },
  plusieurs_demandes: {
    label: 'Plusieurs demandes (raccordement + accompagnement, en cours puis clôturées)',
    props: {
      demands: [
        {
          address: '12 Place du Capitole, 31000 Toulouse',
          status: demandStatusDisplays[DEMANDE_STATUS.COMMERCIAL_PROPOSAL],
          type: 'raccordement',
        },
        {
          address: '5 Rue de la Paix, 75002 Paris',
          status: demandeChaleurRenouvelableStatusDisplays['Recontacté pour premier échange'],
          type: 'accompagnement',
        },
        {
          address: '8 Avenue Jean Jaurès, 69007 Lyon',
          status: demandStatusDisplays[DEMANDE_STATUS.UNREALISABLE],
          type: 'raccordement',
        },
      ],
      firstName: null,
    },
  },
});

export default SuiviDemande;
