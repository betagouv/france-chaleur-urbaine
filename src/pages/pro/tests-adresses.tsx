import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import CreateEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CreateEligibilityTestForm';
import ProEligibilityTestItem from '@/components/dashboard/professionnel/ProEligibilityTestItem';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import Section, { SectionContent, SectionSubtitle, SectionTitle } from '@/components/ui/Section';
import { useFetch } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { withAuthentication } from '@/server/authentication';

export default function TestsAdresses(): JSX.Element {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);

  const { data: eligibilityTests, isLoading } = useFetch<ProEligibilityTestListItem[]>('/api/pro-eligibility-tests', {
    refetchInterval: hasPendingJobs ? 5000 : false,
  });

  useEffect(() => {
    setHasPendingJobs(eligibilityTests?.some((test) => test.has_pending_jobs) ?? false);
  }, [eligibilityTests]);

  const newTestButton = (
    <ModalSimple title="Création d'un test d'adresses" size="medium" trigger={<Button>Nouveau test</Button>}>
      <CreateEligibilityTestForm />
    </ModalSimple>
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
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">france-chaleur-urbaine@developpement-durable.gouv.fr</a>
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
                    <ProEligibilityTestItem test={test} />
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

export const getServerSideProps = withAuthentication(['particulier', 'professionnel', 'gestionnaire', 'admin']);
