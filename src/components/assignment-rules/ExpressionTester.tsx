import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';
import { testExpression } from '@/utils/expression-parser';

export type ExpressionTesterProps = {
  expression: string;
  className?: string;
  onPropertySelect?: (property: string) => void;
};

// Fonction pour aplatir un objet JSON en propriétés avec chemins
const flattenObject = (
  obj: any,
  prefix = '',
  result: { path: string; value: any; type: string }[] = []
): { path: string; value: any; type: string }[] => {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Objet : continuer la récursion sans ajouter l'objet lui-même
        flattenObject(value, path, result);
      } else if (Array.isArray(value)) {
        // Tableau : ajouter la propriété
        result.push({ path, type: 'array', value });
      } else {
        // Valeur primitive
        const type = typeof value;
        result.push({ path, type, value });
      }
    }
  }
  return result;
};

// Données d'éligibilité par défaut pour les tests
const getDefaultEligibilityData = () => ({
  commune: {
    insee_com: '94028',
    insee_dep: '94',
    insee_reg: '11',
    nom: 'Créteil',
  },
  communes: ['Créteil'],
  departement: {
    insee_dep: '94',
    nom: 'Val-de-Marne',
  },
  distance: 0,
  epci: {
    code: '200054781',
    nom: 'Métropole du Grand Paris',
    type: 'METRO',
  },
  ept: {
    code: '200057958',
    nom: 'Établissement public territorial Grand-Orly Seine Bièvre',
  },
  id_sncu: '9402C',
  nom: 'Réseaux de Créteil - Scuc',
  pdp: {
    communes: ['Créteil'],
    'Identifiant reseau': '9402C',
    id_fcu: 162,
    reseau_de_chaleur_ids: [],
    reseau_en_construction_ids: [9, 71, 72],
  },
  region: {
    insee_reg: '11',
    nom: 'Île-de-France',
  },
  reseauDeChaleur: {
    communes: ['Créteil'],
    distance: 29,
    'Identifiant reseau': '9402C',
    id_fcu: 296,
    nom_reseau: 'Réseaux de Créteil - Scuc',
    tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
  },
  reseauDeChaleurSansTrace: {
    communes: ['Créteil'],
    'Identifiant reseau': '9403C',
    id_fcu: 1076,
    nom: 'Créteil',
    nom_reseau: 'Réseau Créteil Village',
    tags: ['Dalkia', 'Dalkia_IDF'],
  },
  reseauEnConstruction: {
    communes: ['Bourg-la-Reine', 'Fontenay-aux-Roses', 'Sceaux'],
    distance: 8752,
    id_fcu: 158,
    nom_reseau: null,
    tags: ['SIPPEREC', 'SIPPEREC_BLR'],
  },
  tags: ['ENGIE', 'ENGIE_IDF', 'DALKIA'],
  type: 'dans_pdp',
  zoneEnConstruction: {
    communes: ['Créteil'],
    distance: 0,
    id_fcu: 71,
    nom_reseau: 'Réseaux de Créteil - Scuc',
    tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
  },
});

const ExpressionTester = ({ expression, className, onPropertySelect }: ExpressionTesterProps) => {
  const [mode, setMode] = useState<'properties' | 'simple' | 'json'>('properties');
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(getDefaultEligibilityData(), null, 2));
  const [testTags, setTestTags] = useState<string>('ENGIE,ENGIE_IDF,DALKIA');
  const [testResult, setTestResult] = useState<{ isValid: boolean; error?: string; result?: boolean } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const getCurrentEligibilityData = () => {
    if (mode === 'json') {
      try {
        return JSON.parse(jsonData);
      } catch (error) {
        throw new Error(`JSON invalide: ${error instanceof Error ? error.message : 'Format incorrect'}`);
      }
    } else {
      // Mode simple ou propriétés : modification des tags uniquement
      const tags = testTags
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      return {
        ...getDefaultEligibilityData(),
        tags,
      };
    }
  };

  const getFilteredProperties = () => {
    try {
      const eligibilityData = getCurrentEligibilityData();
      const flattened = flattenObject(eligibilityData);

      if (!searchFilter.trim()) {
        return flattened;
      }

      const filter = searchFilter.toLowerCase();
      return flattened.filter((prop) => prop.path.toLowerCase().includes(filter) || String(prop.value).toLowerCase().includes(filter));
    } catch (_error) {
      return [];
    }
  };

  const handleTest = () => {
    if (!expression.trim()) {
      setTestResult(null);
      return;
    }

    try {
      setJsonError(null);
      const eligibilityData = getCurrentEligibilityData();
      const result = testExpression(expression, eligibilityData);
      setTestResult(result);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Erreur inconnue');
      setTestResult(null);
    }
  };

  const handleClear = () => {
    setTestTags('ENGIE,ENGIE_IDF,DALKIA');
    setJsonData(JSON.stringify(getDefaultEligibilityData(), null, 2));
    setTestResult(null);
    setJsonError(null);
    setSearchFilter('');
  };

  const handleModeChange = (newMode: 'properties' | 'simple' | 'json') => {
    if (newMode === 'json' && mode !== 'json') {
      // Passage en mode JSON : inclure les tags actuels
      try {
        const currentData = getCurrentEligibilityData();
        setJsonData(JSON.stringify(currentData, null, 2));
      } catch (_error) {
        // Garder le JSON actuel en cas d'erreur
      }
    }
    setMode(newMode);
    setJsonError(null);
    setTestResult(null);
  };

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    setJsonError(null);
    setTestResult(null);
  };

  const handlePropertyClick = (property: string) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      return '{...}';
    }
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string':
        return 'text-green-600';
      case 'number':
        return 'text-blue-600';
      case 'boolean':
        return 'text-purple-600';
      case 'array':
        return 'text-orange-600';
      case 'object':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const renderResult = (): ReactNode => {
    if (jsonError) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-sm">
          <div className="text-sm text-red-800">
            <strong>Erreur JSON :</strong> {jsonError}
          </div>
        </div>
      );
    }

    if (!testResult) return null;

    if (!testResult.isValid) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-sm">
          <div className="text-sm text-red-800">
            <strong>Erreur d'expression :</strong> {testResult.error}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-sm">
        <div className="text-sm">
          <strong>Résultat :</strong>{' '}
          <span className={testResult.result ? 'text-green-600' : 'text-red-600'}>{testResult.result ? 'Vrai' : 'Faux'}</span>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          L'expression est valide et retourne {testResult.result ? 'true' : 'false'} avec les données de test.
        </div>
      </div>
    );
  };

  return (
    <div className={cx('mt-3 p-3 bg-gray-50 border rounded-sm', className)}>
      <div className="text-sm font-medium mb-2">Tester l'expression</div>

      <div className="space-y-3">
        {/* Sélecteur de mode */}
        <div className="flex gap-2">
          <Button size="small" priority={mode === 'properties' ? 'primary' : 'secondary'} onClick={() => handleModeChange('properties')}>
            Propriétés
          </Button>
          <Button size="small" priority={mode === 'simple' ? 'primary' : 'secondary'} onClick={() => handleModeChange('simple')}>
            Mode simple
          </Button>
          <Button size="small" priority={mode === 'json' ? 'primary' : 'secondary'} onClick={() => handleModeChange('json')}>
            Mode JSON
          </Button>
        </div>

        {/* Interface selon le mode */}
        {mode === 'properties' ? (
          <div>
            <div className="mb-2">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher dans les propriétés..."
                className="fr-input w-full px-2 py-1 text-sm border rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border rounded-sm max-h-80 overflow-y-auto bg-white">
              <div className="text-xs text-gray-500 p-2 border-b bg-gray-50">Cliquez sur une propriété pour l'ajouter à votre règle</div>
              {getFilteredProperties().map((prop, index) => (
                <div
                  key={index}
                  onClick={() => handlePropertyClick(prop.path)}
                  className="px-2 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-blue-700 flex-1 truncate">{prop.path}</span>
                    <span className="text-xs text-gray-500">{formatValue(prop.value)}</span>
                    <span className={cx('text-xs px-1 rounded-sm', getTypeColor(prop.type))}>{prop.type}</span>
                  </div>
                </div>
              ))}
              {getFilteredProperties().length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">Aucune propriété trouvée</div>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-1">Test avec données par défaut : Créteil (94), type "dans_pdp", distance 0m.</div>
          </div>
        ) : mode === 'json' ? (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Données d'éligibilité (JSON)</label>
            <textarea
              value={jsonData}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full px-2 py-1 text-xs font-mono border rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              rows={12}
              placeholder="Entrez les données d'éligibilité au format JSON..."
            />
            <div className="text-xs text-gray-500 mt-1">
              Modifiez directement le JSON pour tester différentes conditions : tags, commune, type, distance, etc.
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tags de test (séparés par des virgules)</label>
            <input
              type="text"
              value={testTags}
              onChange={(e) => setTestTags(e.target.value)}
              placeholder="Ex: ENGIE, ENGIE_IDF, DALKIA"
              className="w-full px-2 py-1 text-sm border rounded-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
            <div className="text-xs text-gray-500 mt-1">
              Test avec données par défaut : Créteil (94), type "dans_pdp", distance 0m.
              <br />
              Vous pouvez tester des conditions comme : tags:"ENGIE*", departement.nom:"Val-de-Marne", region.nom:"Île-de-France",
              epci.nom:"Métropole du Grand Paris", type:"dans_pdp", distance:&lt;100
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="small" onClick={handleTest} disabled={!expression.trim()}>
            Tester
          </Button>
          <Button size="small" priority="secondary" onClick={handleClear}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {renderResult()}
    </div>
  );
};

export default ExpressionTester;
