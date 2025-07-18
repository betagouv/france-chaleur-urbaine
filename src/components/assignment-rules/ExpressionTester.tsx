import { type ReactNode, useState } from 'react';

import Button from '@/components/ui/Button';
import cx from '@/utils/cx';
import { testExpression } from '@/utils/expression-parser';

export type ExpressionTesterProps = {
  expression: string;
  className?: string;
};

// Données d'éligibilité par défaut pour les tests
const getDefaultEligibilityData = () => ({
  type: 'dans_pdp',
  distance: 0,
  id_sncu: '9402C',
  nom: 'Réseaux de Créteil - Scuc',
  tags: ['ENGIE', 'ENGIE_IDF', 'DALKIA'],
  communes: ['Créteil'],
  commune: {
    nom: 'Créteil',
    insee_com: '94028',
    insee_dep: '94',
    insee_reg: '11',
  },
  departement: {
    nom: 'Val-de-Marne',
    insee_dep: '94',
  },
  region: {
    nom: 'Île-de-France',
    insee_reg: '11',
  },
  epci: {
    code: '200054781',
    nom: 'Métropole du Grand Paris',
    type: 'METRO',
  },
  ept: {
    code: '200057958',
    nom: 'Établissement public territorial Grand-Orly Seine Bièvre',
  },
  reseauDeChaleur: {
    id_fcu: 296,
    'Identifiant reseau': '9402C',
    nom_reseau: 'Réseaux de Créteil - Scuc',
    tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
    communes: ['Créteil'],
    distance: 29,
  },
  reseauDeChaleurSansTrace: {
    id_fcu: 1076,
    'Identifiant reseau': '9403C',
    nom_reseau: 'Réseau Créteil Village',
    nom: 'Créteil',
    tags: ['Dalkia', 'Dalkia_IDF'],
    communes: ['Créteil'],
  },
  reseauEnConstruction: {
    id_fcu: 158,
    nom_reseau: null,
    tags: ['SIPPEREC', 'SIPPEREC_BLR'],
    communes: ['Bourg-la-Reine', 'Fontenay-aux-Roses', 'Sceaux'],
    distance: 8752,
  },
  zoneEnConstruction: {
    id_fcu: 71,
    nom_reseau: 'Réseaux de Créteil - Scuc',
    tags: ['Dalkia', 'Dalkia_IDF', 'Dalkia_9402C'],
    communes: ['Créteil'],
    distance: 0,
  },
  pdp: {
    id_fcu: 162,
    'Identifiant reseau': '9402C',
    communes: ['Créteil'],
    reseau_de_chaleur_ids: [],
    reseau_en_construction_ids: [9, 71, 72],
  },
});

const ExpressionTester = ({ expression, className }: ExpressionTesterProps) => {
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(getDefaultEligibilityData(), null, 2));
  const [testTags, setTestTags] = useState<string>('ENGIE,ENGIE_IDF,DALKIA');
  const [testResult, setTestResult] = useState<{ isValid: boolean; error?: string; result?: boolean } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const getCurrentEligibilityData = () => {
    if (isJsonMode) {
      try {
        return JSON.parse(jsonData);
      } catch (error) {
        throw new Error(`JSON invalide: ${error instanceof Error ? error.message : 'Format incorrect'}`);
      }
    } else {
      // Mode simple : modification des tags uniquement
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
  };

  const handleModeToggle = () => {
    if (!isJsonMode) {
      // Passage en mode JSON : inclure les tags actuels
      try {
        const currentData = getCurrentEligibilityData();
        setJsonData(JSON.stringify(currentData, null, 2));
      } catch (error) {
        // Garder le JSON actuel en cas d'erreur
      }
    }
    setIsJsonMode(!isJsonMode);
    setJsonError(null);
    setTestResult(null);
  };

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    setJsonError(null);
    setTestResult(null);
  };

  const renderResult = (): ReactNode => {
    if (jsonError) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-sm text-red-800">
            <strong>Erreur JSON :</strong> {jsonError}
          </div>
        </div>
      );
    }

    if (!testResult) return null;

    if (!testResult.isValid) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-sm text-red-800">
            <strong>Erreur d'expression :</strong> {testResult.error}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">
          <strong>Résultat :</strong> {testResult.result ? 'Vrai' : 'Faux'}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          L'expression est valide et retourne {testResult.result ? 'true' : 'false'} avec les données de test.
        </div>
      </div>
    );
  };

  if (!expression.trim()) {
    return null;
  }

  return (
    <div className={cx('mt-3 p-3 bg-gray-50 border rounded', className)}>
      <div className="text-sm font-medium mb-2">Tester l'expression</div>

      <div className="space-y-3">
        {/* Sélecteur de mode */}
        <div className="flex gap-2">
          <Button size="small" priority={!isJsonMode ? 'primary' : 'secondary'} onClick={() => !isJsonMode || handleModeToggle()}>
            Mode simple
          </Button>
          <Button size="small" priority={isJsonMode ? 'primary' : 'secondary'} onClick={() => isJsonMode || handleModeToggle()}>
            Mode JSON
          </Button>
        </div>

        {/* Interface selon le mode */}
        {isJsonMode ? (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Données d'éligibilité (JSON)</label>
            <textarea
              value={jsonData}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full px-2 py-1 text-xs font-mono border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
            <div className="text-xs text-gray-500 mt-1">
              Test avec données par défaut : Créteil (94), type "dans_pdp", distance 0m.
              <br />
              Vous pouvez tester des conditions comme : tag:"ENGIE*", departement.nom:"Val-de-Marne", region.nom:"Île-de-France",
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
