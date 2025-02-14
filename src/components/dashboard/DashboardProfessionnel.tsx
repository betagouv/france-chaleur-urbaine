import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

import CreateEligibilityTestForm from '@/components/dashboard/professionnel/eligibility-test/CreateEligibilityTestForm';
import ProEligibilityTestItem from '@/components/dashboard/professionnel/ProEligibilityTestItem';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import Modal, { createModal } from '@/components/ui/Modal';
import { useFetch } from '@/hooks/useApi';
import { type ProEligibilityTestListItem } from '@/pages/api/pro-eligibility-tests';

export const modalNewEligibilityTest = createModal({
  id: 'new-eligibility-test-modal',
  isOpenedByDefault: false,
});

export default function DashboardProfessionnel() {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);

  const { data: eligibilityTests, isLoading } = useFetch<ProEligibilityTestListItem[]>('/api/pro-eligibility-tests', {
    refetchInterval: hasPendingJobs ? 5000 : false,
  });

  useEffect(() => {
    setHasPendingJobs(eligibilityTests?.some((test) => test.has_pending_jobs) ?? false);
  }, [eligibilityTests]);

  return (
    <>
      {/* TODO raccourcis vers outils */}
      <div className="flex items-center justify-between mb-5">
        <Heading as="h2" color="blue-france" mb="0">
          Historique de mes tests d'adresse
        </Heading>

        <Button onClick={() => modalNewEligibilityTest.open()}>Nouveau test</Button>
        <Modal modal={modalNewEligibilityTest} title="Création d'un test d'adresses" size="medium">
          <CreateEligibilityTestForm onClose={() => modalNewEligibilityTest.close()} />
        </Modal>
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
    </>
  );
}
