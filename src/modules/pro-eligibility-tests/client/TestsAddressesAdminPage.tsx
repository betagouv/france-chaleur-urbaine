import { useQueryState } from 'nuqs';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import Text from '@/components/ui/Text';
import { useFetch } from '@/hooks/useApi';
import ProEligibilityTestItem from '@/modules/pro-eligibility-tests/client/ProEligibilityTestItem';
import { type AdminProEligibilityTestListItem } from '@/pages/api/admin/pro-eligibility-tests';

export default function AdminTestsAdresses() {
  const [emailFilter, setEmailFilter] = useQueryState('email');
  const { data: tests, isLoading } = useFetch<AdminProEligibilityTestListItem[]>('/api/admin/pro-eligibility-tests');

  const filteredTests = tests?.filter((test) => !emailFilter || test.user_email?.toLowerCase().includes(emailFilter.toLowerCase()));

  return (
    <SimplePage title="Tests d'adresses (administration)" mode="authenticated">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Tests d'éligibilité
        </Heading>

        <Text className="fr-mb-4w">Cette page permet de consulter l'ensemble des tests d'éligibilité effectués par les utilisateurs.</Text>

        <div className="fr-mb-4w">
          <div className="fr-search-bar" role="search">
            <label className="fr-label" htmlFor="email-filter">
              Filtrer par email
            </label>
            <input
              className="fr-input"
              type="search"
              id="email-filter"
              name="email-filter"
              value={emailFilter ?? ''}
              onChange={(e) => setEmailFilter(e.target.value || null)}
              placeholder="Entrez un email..."
            />
          </div>
        </div>

        {isLoading ? (
          <Loader size="lg" variant="section" />
        ) : (
          <div className="space-y-4">
            {filteredTests?.map((test) => <ProEligibilityTestItem key={test.id} test={test as any} readOnly />)}
          </div>
        )}
      </Box>
    </SimplePage>
  );
}
