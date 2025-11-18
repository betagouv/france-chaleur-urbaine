import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import base from '@/server/db/airtable';
import { logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';
import type { Demand } from '@/types/Summary/Demand';

const CACHE_DIR = join(tmpdir(), 'fcu');
const CACHE_FILE = join(CACHE_DIR, 'demands-cache.json');

// S'assure que le répertoire de cache existe
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

type CachedDemands = {
  demands: Demand[];
};

/**
 * Liste toutes les demandes depuis Airtable avec cache.
 * Cette fonction est conçue pour être réutilisable et peut être modifiée plus tard
 * pour changer la source de récupération des demandes.
 */
export const getAllDemands = async (): Promise<Demand[]> => {
  // Vérifie si le cache existe
  if (existsSync(CACHE_FILE)) {
    try {
      const cacheContent = readFileSync(CACHE_FILE, 'utf-8');
      const cached: CachedDemands = JSON.parse(cacheContent);

      if (cached.demands && Array.isArray(cached.demands)) {
        logger.info('demands-legacy: Using cached demands', {
          count: cached.demands.length,
        });

        // Convertit les dates string en Date objects si nécessaire
        return cached.demands.map((demand) => {
          // S'assure que les dates sont bien des strings (Airtable les retourne comme ça)
          if (demand['Date demandes'] && typeof demand['Date demandes'] !== 'string') {
            return {
              ...demand,
              'Date demandes': new Date(demand['Date demandes']).toISOString(),
            };
          }
          return demand;
        });
      }
    } catch (error) {
      logger.warn('demands-legacy: Failed to read cache, fetching from Airtable', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Récupère depuis Airtable
  logger.info('demands-legacy: Fetching demands from Airtable');
  const startTime = Date.now();
  const records = await base(Airtable.DEMANDES)
    .select({ sort: [{ direction: 'desc', field: 'Date demandes' }] })
    .all();

  const demands = records.map((record) => {
    const demand = { id: record.id, ...record.fields } as Demand;

    // Normalise les dates : s'assure qu'elles sont des strings ISO
    if (demand['Date demandes']) {
      if (typeof demand['Date demandes'] === 'string') {
        // Vérifie si c'est déjà une date ISO valide
        const date = new Date(demand['Date demandes']);
        if (!Number.isNaN(date.getTime())) {
          demand['Date demandes'] = date.toISOString();
        }
      } else {
        // Si c'est un objet Date ou autre, convertit en ISO string
        const date = new Date(demand['Date demandes']);
        if (!Number.isNaN(date.getTime())) {
          demand['Date demandes'] = date.toISOString();
        } else {
          demand['Date demandes'] = '';
        }
      }
    }

    return demand;
  });

  const duration = Date.now() - startTime;
  logger.info('demands-legacy: Fetched demands from Airtable', {
    count: demands.length,
    durationMs: duration,
  });

  // Sauvegarde dans le cache
  try {
    const cacheData: CachedDemands = {
      demands,
    };
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    logger.info('demands-legacy: Cached demands', { count: demands.length });
  } catch (error) {
    logger.warn('demands-legacy: Failed to write cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return demands;
};
