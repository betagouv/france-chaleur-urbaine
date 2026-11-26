import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import {
  cleanDatabase,
  createLineGeometry,
  createPolygonGeometry,
  seedReseauDeChaleur,
  seedZoneDeDeveloppementPrioritaire,
  seedZoneEtReseauEnConstruction,
} from '@/tests/fixtures';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

const PARIS = { lat: 48.8566, lon: 2.3522 };

const seedRequest = (networkLabel: string, kind: 'autre' | 'enquete', status: 'pending' | 'processed') =>
  kdb
    .insertInto('network_change_requests')
    .values({
      contact_type: 'exploitant',
      kind,
      network_label: networkLabel,
      payload: JSON.stringify({ dansCadreDemandeADEME: false, precisions: 'x' }),
      status,
    })
    .execute();

describe('dataDiagnosticRouter', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('dataDiagnostic.run', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.dataDiagnostic.run({ onDemand: false });

      if (allowed) {
        expect(await callRoute()).toStrictEqual([]);
      } else {
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });

    it('classe les erreurs avant les avertissements et ne lance les contrôles longs qu’à la demande', async () => {
      // a perimeter linked to a missing network (error) and to a network that does not cross it (warning, on demand)
      await seedReseauDeChaleur({
        geom: createLineGeometry(PARIS.lon, PARIS.lat, 5000),
        id_fcu: 2,
        nom_reseau: 'Réseau lointain',
        ouvert_aux_raccordements: false,
      });
      await seedZoneDeDeveloppementPrioritaire({
        geom: createPolygonGeometry(PARIS.lon, PARIS.lat, 500),
        id_fcu: 1,
        reseau_de_chaleur_ids: [2, 99],
        reseau_en_construction_ids: [],
      });
      await seedRequest('Réseau A', 'enquete', 'pending'); // warning
      await seedRequest('Réseau B', 'enquete', 'pending');
      const caller = createTestCaller(testUsers.admin);
      const issueSummaries = async (onDemand: boolean) =>
        (await caller.dataDiagnostic.run({ onDemand })).map((issue) => [issue.severity, issue.theme, issue.type, issue.totalCount]);

      expect(await issueSummaries(false)).toStrictEqual([
        ['error', 'networks', 'pdp.orphan_network', 1],
        ['warning', 'networks', 'network.survey_discrepancy', 2],
      ]);
      expect(await issueSummaries(true)).toStrictEqual([['warning', 'networks', 'pdp.link_without_intersection', 1]]);
    });

    it('compare le tracé des réseaux au périmètre des PDP', async () => {
      const crossing = createLineGeometry(PARIS.lon, PARIS.lat, 100);
      const farAway = createLineGeometry(PARIS.lon, PARIS.lat, 5000);
      await Promise.all([
        seedReseauDeChaleur({ geom: crossing, id_fcu: 1, nom_reseau: 'Réseau lié qui traverse', ouvert_aux_raccordements: false }),
        seedReseauDeChaleur({
          geom: farAway,
          'Identifiant reseau': '7502C',
          id_fcu: 2,
          nom_reseau: 'Réseau lié lointain',
          ouvert_aux_raccordements: false,
        }),
        seedReseauDeChaleur({
          geom: crossing,
          id_fcu: 3,
          nom_reseau: 'Réseau non lié qui traverse',
          ouvert_aux_raccordements: true,
          'reseaux classes': true,
        }),
        // crosses the perimeter without being linked, but not classified: not expected to be linked
        seedReseauDeChaleur({ geom: crossing, id_fcu: 4, nom_reseau: 'Réseau non classé', ouvert_aux_raccordements: true }),
        seedZoneEtReseauEnConstruction({
          geom: farAway,
          id_fcu: 1,
          nom_reseau: 'Extension liée lointaine',
          ouvert_aux_raccordements: false,
        }),
        seedZoneEtReseauEnConstruction({ geom: crossing, id_fcu: 2, nom_reseau: 'Extension non liée', ouvert_aux_raccordements: true }),
      ]);
      await seedZoneDeDeveloppementPrioritaire({
        geom: createPolygonGeometry(PARIS.lon, PARIS.lat, 500),
        id_fcu: 1,
        reseau_de_chaleur_ids: [1, 2],
        reseau_en_construction_ids: [1],
      });

      const issues = await createTestCaller(testUsers.admin).dataDiagnostic.run({ onDemand: true });

      const href = '/admin/reseaux?reseauxTab=perimetres-de-developpement-prioritaire&reseauId=1';
      expect(
        issues
          .filter((issue) => issue.type.startsWith('pdp.'))
          .map(({ items, totalCount, type }) => ({ items, totalCount, type }))
          .sort((first, second) => first.type.localeCompare(second.type))
      ).toStrictEqual([
        {
          items: [
            {
              context: 'réseaux de chaleur : 2 Réseau lié lointain (7502C) / en construction : 1 Extension liée lointaine',
              href,
              label: 'PDP #1',
            },
          ],
          totalCount: 1,
          type: 'pdp.link_without_intersection',
        },
        {
          items: [
            {
              context: 'réseaux de chaleur : 3 Réseau non lié qui traverse / en construction : 2 Extension non liée',
              href,
              label: 'PDP #1',
            },
          ],
          totalCount: 1,
          type: 'pdp.missing_network_link',
        },
      ]);
    });
  });

  it('signale les écarts de l’enquête FEDENE encore à décider', async () => {
    await seedRequest('Réseau B', 'enquete', 'pending');
    await seedRequest('Réseau A', 'enquete', 'pending');
    await seedRequest('Réseau décidé', 'enquete', 'processed');
    await seedRequest('Modification déposée', 'autre', 'pending'); // counted by the dashboard indicator, not an anomaly

    const issues = await createTestCaller(testUsers.admin).dataDiagnostic.run({ onDemand: false });

    expect(issues.map(({ items, severity, totalCount, type }) => ({ items, severity, totalCount, type }))).toStrictEqual([
      {
        items: [
          { href: '/admin/enquete-fedene', label: 'Réseau A' },
          { href: '/admin/enquete-fedene', label: 'Réseau B' },
        ],
        severity: 'warning',
        totalCount: 2,
        type: 'network.survey_discrepancy',
      },
    ]);
  });
});
