import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { clientConfig } from '@/client-config';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import Section, { SectionContent, SectionSubtitle, SectionTitle } from '@/components/ui/Section';
import useCrud from '@/hooks/useCrud';
import ProEligibilityTestItem from '@/modules/pro-eligibility-tests/client/ProEligibilityTestItem';
import UpsertEligibilityTestForm from '@/modules/pro-eligibility-tests/client/UpsertEligibilityTestForm';
import { type ProEligibilityTestResponse } from '@/modules/pro-eligibility-tests/server/api';

export default function TestsAdressesPage(): JSX.Element {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    items,
    isLoading,
    delete: deleteTest,
  } = useCrud('/api/pro-eligibility-tests', {
    list: [undefined, { refetchInterval: hasPendingJobs ? 5000 : false }],
  });

  const eligibilityTests = items as unknown as ProEligibilityTestResponse['listItem'][];

  useEffect(() => {
    setHasPendingJobs(eligibilityTests?.some((test) => test.has_pending_jobs) ?? false);
  }, [eligibilityTests]);

  const newTestButton = (
    <Dialog
      title="Création d'un test d'adresses"
      trigger={<Button>Nouveau test</Button>}
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      size="lg"
    >
      <UpsertEligibilityTestForm onComplete={() => setIsDialogOpen(false)} />
    </Dialog>
  );

  return (
    <SimplePage
      title="Test d'adresses en masse"
      description="Votre tableau de bord pour la gestion de vos tests d'adresses en masse"
      mode="authenticated"
    >
      <Box as="main" className="fr-container" my="4w">
        <Heading color="blue-france">Test d'adresses en masse</Heading>
        <p>
          Repérez sur un parc de bâtiments ceux potentiellement raccordables, et accédez aux caractéristiques des réseaux les plus proches.
        </p>
        <p>
          Pour être mis en relation avec le gestionnaire d'un réseau pour obtenir plus d'informations, vous pouvez utiliser le formulaire en
          ligne sur notre site ou nous contacter par mail si le besoin concerne plusieurs adresses&nbsp;:{' '}
          <a href={`mailto:${clientConfig.contactEmail}`}>{clientConfig.contactEmail}</a>
        </p>
        <div className="flex items-center justify-between fr-mb-2w">
          <Heading as="h3" color="blue-france" mb="0">
            Vos tests
          </Heading>
          {eligibilityTests?.length ? newTestButton : null}
        </div>
        {isLoading ? (
          <Loader size="lg" variant="section" />
        ) : (
          <>
            {eligibilityTests?.length ? (
              <AnimatePresence>
                {eligibilityTests?.map((test) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProEligibilityTestItem test={test} onDelete={() => deleteTest(test.id as string)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <Section variant="empty">
                <SectionTitle>Vous n'avez effectué aucun test d'adresses pour le moment</SectionTitle>
                <SectionSubtitle>Pour réaliser un test, cliquez sur "Nouveau test" et téléchargez votre liste d'adresses.</SectionSubtitle>
                <SectionContent className="flex justify-center">{newTestButton}</SectionContent>
              </Section>
            )}
          </>
        )}
      </Box>
    </SimplePage>
  );
}
