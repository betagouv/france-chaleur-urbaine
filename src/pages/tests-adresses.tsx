import { motion, AnimatePresence } from 'framer-motion';
import { type GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import CreateEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CreateEligibilityTestForm';
import ProEligibilityTestItem from '@/components/dashboard/professionnel/ProEligibilityTestItem';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import { useFetch } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';
import { withAuthentication } from '@/server/helpers/ssr/withAuthentication';

export default function TestsAdresses(): JSX.Element {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);

  const { data: eligibilityTests, isLoading } = useFetch<ProEligibilityTestListItem[]>('/api/pro-eligibility-tests', {
    refetchInterval: hasPendingJobs ? 5000 : false,
  });

  useEffect(() => {
    setHasPendingJobs(eligibilityTests?.some((test) => test.has_pending_jobs) ?? false);
  }, [eligibilityTests]);

  return (
    <SimplePage title="Tests d'adresses" description="Votre tableau de bord pour la gestion de vos tests d'adresses" mode="authenticated">
      <Box as="main" className="fr-container" my="4w">
        <div className="flex items-center justify-between fr-mb-4w">
          <Heading color="blue-france" className="!mb-0">
            Tests d'adresses
          </Heading>
          <ModalSimple title="Création d'un test d'adresses" size="medium" trigger={<Button>Nouveau test</Button>}>
            <CreateEligibilityTestForm />
          </ModalSimple>
        </div>
        {isLoading && <Loader size="lg" />}
        {eligibilityTests?.length === 0 && <>Aucun test</>}
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
      </Box>
    </SimplePage>
  );
}

export const getServerSideProps: GetServerSideProps = withAuthentication('professionnel');
