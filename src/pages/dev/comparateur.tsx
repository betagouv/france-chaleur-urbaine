import dynamic from 'next/dynamic';

import SimplePage from '@/components/shared/page/SimplePage';
import Loader from '@/components/ui/Loader';

// Building the publicodes engine takes a few hundred milliseconds and is useless on the server
const ComparateurPoc = dynamic(
  () => import('@/components/ComparateurPublicodes/poc/ComparateurPoc').then((module) => module.ComparateurPoc),
  {
    loading: () => <Loader size="xl" variant="section" />,
    ssr: false,
  }
);

/**
 * Dev-only POC of the next comparator (not in navigation, accessible by URL): shared context + side-by-side scenarios.
 */
const ComparateurDevPage = () => {
  return (
    <SimplePage title="Comparateur de coûts et CO2" layout="center" noIndex>
      <h1 className="text-2xl">Comparateur de coûts et CO2</h1>
      <ComparateurPoc />
    </SimplePage>
  );
};

export default ComparateurDevPage;
