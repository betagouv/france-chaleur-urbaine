import SimplePage from '@/components/shared/page/SimplePage';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import { type CommandTestResult } from '@/modules/diagnostic/server/service';
import trpc from '@/modules/trpc/client';
import { type CommandResult } from '@/utils/system';

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
        <Alert variant="error" title="Erreur lors du diagnostic">
          {error.message || "Une erreur inattendue s'est produite"}
        </Alert>
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
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Base Airtable</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getAirtableBaseStatus(diagnosticData.airtable)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">USE_DOCKER_GEO_COMMANDS</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div>{diagnosticData.geo.USE_DOCKER_GEO_COMMANDS ? 'Activé' : 'Désactivé'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {diagnosticData.geo.USE_DOCKER_GEO_COMMANDS
                      ? 'Les commandes géographiques utilisent Docker'
                      : 'Les commandes géographiques utilisent les binaires système'}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">ogr2ogr</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="space-y-1 text-wrap">
                    <div>{getCommandResultStatus(diagnosticData.geo.ogr2ogr.version)}</div>
                    <div>{getFunctionalTestStatus(diagnosticData.geo.ogr2ogr.functional)}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">tippecanoe</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="space-y-1 text-wrap">
                    <div>{getCommandResultStatus(diagnosticData.geo.tippecanoe.version)}</div>
                    <div>{getFunctionalTestStatus(diagnosticData.geo.tippecanoe.functional)}</div>
                  </div>
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

const getCommandResultStatus = (commandResult: CommandResult) => {
  return `Version : ${commandResult.success ? '' : '❌'} ${commandResult.output}`;
};

const getFunctionalTestStatus = (functionalResult: CommandTestResult) => {
  return functionalResult.success ? 'Test fonctionnel : ✅ Réussi' : `Test fonctionnel : ❌ ${functionalResult.error}`;
};

const getAirtableBaseStatus = (airtableBase: string) => {
  if (airtableBase.startsWith('inconnu')) {
    return `❌ ${airtableBase}`;
  }

  const statusMap = {
    prod: '🟢 Production',
    dev: '🟡 Développement',
  } as const;

  return statusMap[airtableBase as keyof typeof statusMap] || `❓ ${airtableBase}`;
};
