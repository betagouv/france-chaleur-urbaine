import dayjs from 'dayjs';

import Tooltip from '@/components/ui/Tooltip';
import { defineLayerPopup, type MapSourceLayersSpecification } from '@/modules/map/client/core/common';
import type { ProEligibilityTestEligibility } from '@/modules/pro-eligibility-tests/types';
import { type StructureType, structureTypesLabels } from '@/modules/users/constants';
import type { UserRole } from '@/types/enum/UserRole';
import { upperCaseFirstChar } from '@/utils/strings';

export const testsAdressesLayerStyle = {
  eligible: {
    fill: { color: '#00ff88', size: 1 },
    stroke: { color: '#037f43', size: 1 },
  },
  notEligible: {
    fill: { color: '#ff8c42', size: 1 },
    stroke: { color: '#b9661e', size: 1 },
  },
};

const getSizesArray = (size: number) => {
  return [1, size * 1.25, size * 1.5, size * 2, size * 2.5, size * 3];
};

type TestsAdressesFeature = {
  id: string;
  ban_address: string;
  /** JSON-encoded `ProEligibilityTestEligibility` — the last entry of `eligibility_history` */
  eligibility: string;
  eligible: boolean;
  nb_users: number;
  /** JSON-encoded `TestsAdressesEntry[]` */
  tests: string;
};

/** One row of the tiles `tests` aggregate: a test flattened with its owner */
type TestsAdressesEntry = {
  test_id: string;
  test_name: string;
  test_created_at: string;
  user_id: string;
  user_role: UserRole;
  user_first_name: string | null;
  user_last_name: string | null;
  user_structure_name: string | null;
  user_structure_type: StructureType | null;
  user_phone: string | null;
};

type TestsAdressesTest = {
  id: string;
  name: string;
  created_at: string;
};

type TestsAdressesUser = {
  id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  structure_name: string | null;
  structure_type: StructureType | null;
  phone: string | null;
  tests: TestsAdressesTest[];
};

/**
 * Groups the flat (test x user) rows carried by the tiles into one entry per user.
 */
const groupEntriesByUser = (entries: TestsAdressesEntry[]) => {
  const usersById = new Map<string, TestsAdressesUser>();

  entries.forEach((entry) => {
    const test = { created_at: entry.test_created_at, id: entry.test_id, name: entry.test_name };
    const user = usersById.get(entry.user_id);
    if (user) {
      user.tests.push(test);
      return;
    }
    usersById.set(entry.user_id, {
      first_name: entry.user_first_name,
      id: entry.user_id,
      last_name: entry.user_last_name,
      phone: entry.user_phone,
      role: entry.user_role,
      structure_name: entry.user_structure_name,
      structure_type: entry.user_structure_type,
      tests: [test],
    });
  });

  return Array.from(usersById.values());
};

const Popup = defineLayerPopup<TestsAdressesFeature>(
  ({ ban_address, eligibility: eligibility_string, tests: tests_string }, { Property, Title, TwoColumns }) => {
    const currentEligibility: ProEligibilityTestEligibility | null = eligibility_string ? JSON.parse(eligibility_string) : null;
    const users = groupEntriesByUser(tests_string ? JSON.parse(tests_string) : []);

    return (
      <>
        <Title>{ban_address}</Title>
        <h6 className="text-lg mb-0!">Utilisateurs interessés ({users.length})</h6>
        <TwoColumns>
          {users
            .sort((a, b) => a.first_name?.toLowerCase().localeCompare(b.first_name?.toLowerCase() || '') || 0)
            ?.map(({ id, first_name, last_name, role, structure_name, structure_type, phone, tests }) => {
              const name = first_name || last_name ? `${upperCaseFirstChar(first_name || '')} ${upperCaseFirstChar(last_name || '')}` : '';
              const roleLabel = role ? ` (${role})` : '';

              return (
                <Property
                  key={id}
                  label={
                    <Tooltip title={<>Tel: {phone ? <a href={`tel:${phone}`}>{phone}</a> : 'Non renseigné'}</>}>
                      <span>
                        {name}
                        {roleLabel}
                      </span>
                    </Tooltip>
                  }
                  value={
                    <Tooltip
                      title={tests.map(({ id: test_id, name, created_at }) => (
                        <TwoColumns key={test_id}>
                          <Property label={name} value={dayjs(created_at).format('DD/MM/YYYY HH:mm')} />
                        </TwoColumns>
                      ))}
                    >
                      <span>
                        {structure_name || structure_type
                          ? `${structure_name || ''} ${structure_type ? `(${structureTypesLabels[structure_type]})` : ''}`
                          : 'Structure non connue'}
                      </span>
                    </Tooltip>
                  }
                />
              );
            })}
        </TwoColumns>
        <h6 className="text-lg mb-0!">Éligibilité</h6>

        {currentEligibility?.id_fcu ? (
          <TwoColumns>
            <Property label="ID FCU" value={currentEligibility.id_fcu} />
            <Property label="ID SNCU" value={currentEligibility.id_sncu} />
            <Property label="Nom" value={currentEligibility.nom} />
            <Property label="Type" value={currentEligibility.type} />
            <Property label="Distance" value={`${currentEligibility.distance}m`} />
            {currentEligibility.contenu_co2_acv !== undefined && (
              <Property label="CO2 ACV" value={`${(currentEligibility.contenu_co2_acv * 1000).toFixed(0)} g/kWh`} />
            )}
            {currentEligibility.taux_enrr !== undefined && <Property label="Taux EnR&R" value={`${currentEligibility.taux_enrr}%`} />}
            <Property label="Éligible" value={currentEligibility.eligible ? 'Oui' : 'Non'} />
          </TwoColumns>
        ) : (
          <TwoColumns>
            <Property label="Non éligible" value="Aucun réseau à proximité" />
          </TwoColumns>
        )}
      </>
    );
  }
);

export const testsAdressesLayersSpec = [
  {
    layers: [
      {
        filter: () => ['==', ['get', 'eligible'], false],
        id: 'testsAdresses-notEligible',
        isVisible: (config) => config.testsAdresses,
        paint: {
          'circle-color': testsAdressesLayerStyle.notEligible.fill.color,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            ['interpolate', ['linear'], ['get', 'nb_users'], ...getSizesArray(testsAdressesLayerStyle.notEligible.fill.size)],
            14,
            ['interpolate', ['linear'], ['get', 'nb_users'], ...getSizesArray(testsAdressesLayerStyle.notEligible.fill.size * 4)],
          ],
          'circle-stroke-color': testsAdressesLayerStyle.notEligible.stroke.color,
          'circle-stroke-width': testsAdressesLayerStyle.notEligible.stroke.size,
        },
        popup: Popup,
        type: 'circle',
      },
      {
        filter: () => ['==', ['get', 'eligible'], true],
        id: 'testsAdresses-eligible',
        isVisible: (config) => config.testsAdresses,
        paint: {
          'circle-color': testsAdressesLayerStyle.eligible.fill.color,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            ['interpolate', ['linear'], ['get', 'nb_users'], ...getSizesArray(testsAdressesLayerStyle.eligible.fill.size)],
            14,
            ['interpolate', ['linear'], ['get', 'nb_users'], ...getSizesArray(testsAdressesLayerStyle.eligible.fill.size * 4)],
          ],
          'circle-stroke-color': testsAdressesLayerStyle.eligible.stroke.color,
          'circle-stroke-width': testsAdressesLayerStyle.eligible.stroke.size,
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: { maxzoom: 12 },
    sourceId: 'tests-adresses',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
