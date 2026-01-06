import { describe, expect, it } from 'vitest';

import { analyzeCSV } from './csvColumnDetection';

describe('analyzeCSV()', () => {
  describe('détection de colonnes adresse', () => {
    it('détecte une colonne "adresse"', () => {
      const csv = 'adresse,nom\n10 rue de Paris,Jean\n20 avenue Victor Hugo,Marie';
      const result = analyzeCSV(csv);
      expect(result.columns[0].type).toBe('address');
      expect(result.suggestedAddressColumn).toBe(0);
    });

    it('détecte une colonne "address"', () => {
      const csv = 'address,name\n10 rue de Paris,John';
      const result = analyzeCSV(csv);
      expect(result.columns[0].type).toBe('address');
    });

    it('détecte via le contenu (rue, avenue, etc.)', () => {
      const csv = 'lieu,nom\n10 rue de Paris,Jean\n20 avenue Victor Hugo,Marie';
      const result = analyzeCSV(csv);
      expect(result.columns[0].type).toBe('address');
    });
  });

  describe('détection de colonnes coordonnées', () => {
    it('détecte des colonnes latitude/longitude par header', () => {
      const csv = 'latitude,longitude,nom\n48.8566,2.3522,Paris\n45.764,4.8357,Lyon';
      const result = analyzeCSV(csv);
      expect(result.columns[0].type).toBe('latitude');
      expect(result.columns[1].type).toBe('longitude');
      expect(result.hasCoordinateColumns).toBe(true);
    });

    it('détecte des colonnes lat/lon abrégées', () => {
      const csv = 'lat,lon,ville\n48.8566,2.3522,Paris';
      const result = analyzeCSV(csv);
      expect(result.columns[0].type).toBe('latitude');
      expect(result.columns[1].type).toBe('longitude');
    });

    it('détecte des coordonnées par analyse des valeurs', () => {
      const csv = 'col_y,col_x,nom\n48.8566,2.3522,Paris\n45.764,4.8357,Lyon\n43.2965,5.3698,Marseille';
      const result = analyzeCSV(csv);
      expect(result.columns[0].type).toBe('latitude');
      expect(result.columns[1].type).toBe('longitude');
    });
  });

  describe('détection de colonnes numériques', () => {
    it('détecte une colonne numérique', () => {
      const csv = 'adresse,nb_logements\n10 rue de Paris,50\n20 avenue Victor Hugo,100';
      const result = analyzeCSV(csv);
      expect(result.columns[1].type).toBe('number');
    });
  });

  describe('détection de colonnes texte', () => {
    it('détecte une colonne texte', () => {
      const csv = 'adresse,commentaire\n10 rue de Paris,RAS\n20 avenue Victor Hugo,A vérifier';
      const result = analyzeCSV(csv);
      expect(result.columns[1].type).toBe('text');
    });
  });

  describe('suggestions de colonnes', () => {
    it('suggère la meilleure colonne adresse', () => {
      const csv = 'nom,adresse,lieu\nJean,10 rue de Paris,France';
      const result = analyzeCSV(csv);
      expect(result.suggestedAddressColumn).toBe(1);
    });

    it('suggère latitude et longitude', () => {
      const csv = 'nom,latitude,longitude\nParis,48.8566,2.3522';
      const result = analyzeCSV(csv);
      expect(result.suggestedLatitudeColumn).toBe(1);
      expect(result.suggestedLongitudeColumn).toBe(2);
    });

    it('retourne undefined si pas de colonne adresse', () => {
      const csv = 'nom,age\nJean,30\nMarie,25';
      const result = analyzeCSV(csv);
      expect(result.suggestedAddressColumn).toBeUndefined();
    });
  });

  describe('métadonnées CSV', () => {
    it('retourne le nombre de lignes', () => {
      const csv = 'a,b\n1,2\n3,4\n5,6';
      const result = analyzeCSV(csv);
      expect(result.nbRows).toBe(4);
    });

    it('retourne les headers', () => {
      const csv = 'colonne1,colonne2\n1,2';
      const result = analyzeCSV(csv);
      expect(result.headers).toEqual(['colonne1', 'colonne2']);
    });

    it('retourne les 10 premières lignes', () => {
      let csv = 'a,b\n';
      for (let i = 0; i < 20; i++) {
        csv += `${i},${i * 2}\n`;
      }
      const result = analyzeCSV(csv);
      expect(result.rows.length).toBe(10);
    });

    it('détecte le séparateur', () => {
      const csv = 'a;b\n1;2';
      const result = analyzeCSV(csv);
      expect(result.separator).toBe(';');
    });
  });

  describe('gestion des erreurs', () => {
    it('lance une erreur pour un CSV vide', () => {
      expect(() => analyzeCSV('')).toThrow('Empty or invalid CSV file');
    });
  });

  describe('confidence score', () => {
    it('attribue une haute confiance pour un header exact "adresse"', () => {
      const csv = 'adresse,nom\n10 rue de Paris,Jean';
      const result = analyzeCSV(csv);
      expect(result.columns[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('attribue une haute confiance pour un header exact "latitude"', () => {
      const csv = 'latitude,longitude\n48.8566,2.3522';
      const result = analyzeCSV(csv);
      expect(result.columns[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('attribue une confiance modérée pour une détection par contenu', () => {
      const csv = 'info,data\n10 rue de Paris,test';
      const result = analyzeCSV(csv);
      const addressCol = result.columns.find((c) => c.type === 'address');
      if (addressCol) {
        expect(addressCol.confidence).toBeLessThan(0.9);
      }
    });

    it('la confiance ne dépasse jamais 1', () => {
      const csv = 'adresse,latitude,longitude\n10 rue de la Paix Paris,48.8566,2.3522';
      const result = analyzeCSV(csv);
      result.columns.forEach((col) => {
        expect(col.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
