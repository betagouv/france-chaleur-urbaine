import { type LegalNotice } from '@incubateur-ademe/legal-pages-react';
// @ts-expect-error LegalNoticeClient is not exported
import LegalNoticeClient from '@incubateur-ademe/legal-pages-react/LegalNoticeClient';

const LegalNoticeComponent = LegalNoticeClient as unknown as typeof LegalNotice;

import { clientConfig } from '@/client-config';
import SimplePage from '@/components/shared/page/SimplePage';

function MentionsLegalesPage() {
  return (
    <SimplePage
      title="Mentions légales"
      description="France Chaleur Urbaine est un service du Ministère de la transition écologique qui vise à faciliter et multiplier les raccordements aux réseaux de chaleur."
      layout="center"
    >
      <h1 className="fr-sr-only">Mentions légales</h1>
      <LegalNoticeComponent
        includeBetaGouv
        siteName="France Chaleur Urbaine"
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL!}
        licenceUrl="https://www.etalab.gouv.fr/licence-ouverte-open-licence/"
        date="08/09/2025"
        siteHost={{
          name: 'Scalingo',
          address: '13 rue Jacques Peirotes<br/>67000 Strasbourg',
          country: 'France',
          email: 'support@scalingo.com',
        }}
        contactEmail={clientConfig.contactEmail}
      />
    </SimplePage>
  );
}

export default MentionsLegalesPage;
