import dayjs from 'dayjs';

import Tooltip from '@/components/ui/Tooltip';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { structureTypes } from '@/modules/users/constants';
import { upperCaseFirstChar } from '@/utils/strings';

import type { MapSourceLayersSpecification, PopupStyleHelpers } from './common';

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
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.notEligible.fill.size)],
            14,
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.notEligible.fill.size * 4)],
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
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.eligible.fill.size)],
            14,
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.eligible.fill.size * 4)],
          ],
          'circle-stroke-color': testsAdressesLayerStyle.eligible.stroke.color,
          'circle-stroke-width': testsAdressesLayerStyle.eligible.stroke.size,
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: {
      maxzoom: 12,
      tiles: [`/api/map/testsAdresses/{z}/{x}/{y}`],
      type: 'vector',
    },
    sourceId: 'testsAdresses',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

type TestAdresse = {
  id: string;
  ban_address: string;
  eligibility: string;
  users: string;
};

type Test = {
  id: string;
  name: string;
  created_at: string;
};

type TestUser = {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  structure_name: string;
  structure_type: string;
  phone: string;
  gestionnaires: string[];
  tests: Test[];
};

function Popup(
  { ban_address, eligibility: eligibility_string, users: users_string }: TestAdresse,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  const eligibilityHistory = JSON.parse(eligibility_string) as ProEligibilityTestHistoryEntry[];
  const currentEligibility = eligibilityHistory[eligibilityHistory.length - 1]?.eligibility;
  const users: TestUser[] = users_string ? JSON.parse(users_string) : [];

  return (
    <>
      <Title>{ban_address}</Title>
      <h6 className="text-lg mb-0!">Utilisateurs interessés ({users.length})</h6>
      <TwoColumns>
        {users
          .sort((a, b) => a.first_name?.toLowerCase().localeCompare(b.first_name?.toLowerCase() || '') || 0)
          ?.map(({ id, first_name, last_name, role, structure_name, structure_type, phone, gestionnaires, tests }) => {
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
                        ? `${structure_name || ''} ${structure_type ? `(${structureTypes[structure_type as keyof typeof structureTypes]})` : ''}`
                        : 'Structure non connue'}
                      {(gestionnaires || []).join(', ')}
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
