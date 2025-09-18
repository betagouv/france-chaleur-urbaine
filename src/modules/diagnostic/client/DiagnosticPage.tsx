import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import trpc from '@/modules/trpc/client';

const DiagnosticPage = () => {
  const { data: diagnosticData, error, refetch, isFetching } = trpc.diagnostic.run.useQuery();

  return (
    <SimplePage title="Diagnostic du système" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Diagnostic du système
      </Heading>

      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading as="h2" color="blue-france">
            État du système
          </Heading>
          <p className="text-gray-600 mt-1">Vérification des outils et configurations nécessaires au fonctionnement</p>
        </div>

        <Button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? '🔄 Actualisation...' : '🔄 Actualiser'}
        </Button>
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Diagnostic en cours...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <Heading as="h3" size="h5" className="text-red-800 mb-2">
            Erreur lors du diagnostic
          </Heading>
          <p className="text-red-700 text-sm">{error.message || "Une erreur inattendue s'est produite"}</p>
        </div>
      ) : diagnosticData ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élément</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">ogr2ogr</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getCommandStatus(diagnosticData.geo.ogr2ogr)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">tippecanoe</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getCommandStatus(diagnosticData.geo.tippecanoe)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">USE_DOCKER_GEO_COMMANDS</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {diagnosticData.geo.USE_DOCKER_GEO_COMMANDS ? '🐳 Activé' : '🚫 Désactivé'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </SimplePage>
  );
};

export default DiagnosticPage;

const getCommandStatus = (commandResult: { exists: boolean; output: string }) => {
  return commandResult.exists ? `✅ ${commandResult.output.trim()}` : `❌ ${commandResult.output}`;
};
