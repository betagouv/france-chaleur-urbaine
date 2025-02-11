import { faker } from '@faker-js/faker';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

import ProEligibilityTestItem from '@/components/dashboard/professionnel/ProEligibilityTestItem';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import { useFetch, usePost } from '@/hooks/useApi';
import {
  type ProEligibilityTestCreateInput,
  type ProEligibilityTestCreateOutput,
  type ProEligibilityTestListItem,
} from '@/pages/api/pro-eligibility-tests';

export default function DashboardProfessionnel() {
  const [hasPendingJobs, setHasPendingJobs] = useState(false);

  const { data: eligibilityTests, isLoading } = useFetch<ProEligibilityTestListItem[]>('/api/pro-eligibility-tests', {
    refetchInterval: hasPendingJobs ? 5000 : false,
  });

  const { mutateAsync: createTest, isLoading: isCreating } = usePost<ProEligibilityTestCreateInput, ProEligibilityTestCreateOutput>(
    '/api/pro-eligibility-tests',
    {
      invalidate: ['/api/pro-eligibility-tests'],
    }
  );

  useEffect(() => {
    setHasPendingJobs(eligibilityTests?.some((test) => test.has_pending_jobs) ?? false);
  }, [eligibilityTests]);

  return (
    <>
      {/* TODO raccourcis vers outils */}
      <div className="flex items-center justify-between mb-5">
        <Heading as="h2" color="blue-france" mb="0">
          Historique de mes tests d’adresse
        </Heading>

        <Button
          loading={isCreating}
          className="my-5"
          onClick={async () =>
            createTest({
              name: 'test ' + faker.company.name(),
              csvContent: Array.from({ length: 300 }, () => faker.location.streetAddress()).join('\n'),
            })
          }
        >
          Nouveau test
        </Button>
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
      {/* TODO formulaire nouveau test */}
    </>
  );
}
