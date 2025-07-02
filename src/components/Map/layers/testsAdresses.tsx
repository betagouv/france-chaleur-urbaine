import dayjs from 'dayjs';

import Tooltip from '@/components/ui/Tooltip';
import { upperCaseFirstChar } from '@/utils/strings';
import { structureTypes } from '@/validation/user';

import { type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const testsAdressesLayerStyle = {
  eligible: {
    fill: { color: '#00ff88', size: 1 },
    stroke: { color: '#00cc6a', size: 1 },
  },
  notEligible: {
    fill: { color: '#ff8c42', size: 1 },
    stroke: { color: '#e67e22', size: 1 },
  },
};

const getSizesArray = (size: number) => {
  return [1, size * 1.25, size * 1.5, size * 2, size * 2.5, size * 3];
};

export const testsAdressesLayersSpec = [
  {
    sourceId: 'testsAdresses',
    source: {
      type: 'vector',
      tiles: [`/api/map/testsAdresses/{z}/{x}/{y}`],
      maxzoom: 12,
    },
    layers: [
      {
        id: 'testsAdresses-notEligible',
        type: 'circle',
        filter: () => ['==', ['get', 'isEligible'], false],
        paint: {
          'circle-color': testsAdressesLayerStyle.notEligible.fill.color,
          'circle-stroke-color': testsAdressesLayerStyle.notEligible.stroke.color,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.notEligible.fill.size)],
            14,
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.notEligible.fill.size * 4)],
          ],
          'circle-stroke-width': testsAdressesLayerStyle.notEligible.stroke.size,
        },
        isVisible: (config) => config.testsAdresses,
        popup: Popup,
      },
      {
        id: 'testsAdresses-eligible',
        type: 'circle',
        filter: () => ['==', ['get', 'isEligible'], true],
        paint: {
          'circle-color': testsAdressesLayerStyle.eligible.fill.color,
          'circle-stroke-color': testsAdressesLayerStyle.eligible.stroke.color,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'nbUsers'],
            8,
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.eligible.fill.size)],
            14,
            ['interpolate', ['linear'], ['get', 'nbUsers'], ...getSizesArray(testsAdressesLayerStyle.eligible.fill.size * 4)],
          ],
          'circle-stroke-width': testsAdressesLayerStyle.eligible.stroke.size,
        },
        isVisible: (config) => config.testsAdresses,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

export type TestAdresse = {
  id: string;
  ban_address: string;
  eligibility_status: string;
  users: string;
};

export type Test = {
  id: string;
  name: string;
  created_at: string;
};

export type TestUser = {
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

export type EligibilityStatus = {
  id: string | null;
  co2: number | null;
  name: string | null;
  inPDP: boolean;
  hasPDP: boolean;
  distance: number | null;
  isClasse: boolean;
  tauxENRR: number | null;
  isEligible: boolean;
  futurNetwork: boolean;
  gestionnaire: string | null;
  hasNoTraceNetwork: boolean;
  veryEligibleDistance: number | null;
};

function Popup(
  { ban_address, eligibility_status: eligibility_status_string, users: users_string }: TestAdresse,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  const eligibilityStatus = JSON.parse(eligibility_status_string) as EligibilityStatus;
  const users: TestUser[] = users_string ? JSON.parse(users_string) : [];

  return (
    <>
      <Title>{ban_address}</Title>
      <h6 className="text-lg !mb-0">Utilisateurs interessés ({users.length})</h6>
      <TwoColumns>
        {users
          .sort((a, b) => a.first_name?.toLowerCase().localeCompare(b.first_name?.toLowerCase() || '') || 0)
          ?.map(({ id, first_name, last_name, role, structure_name, structure_type, phone, gestionnaires, tests }) => {
            const name = first_name || last_name ? `${upperCaseFirstChar(first_name)} ${upperCaseFirstChar(last_name)}` : '';
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
      <h6 className="text-lg !mb-0">Éligibilité</h6>

      {eligibilityStatus.id ? (
        <TwoColumns>
          <Property label="ID" value={eligibilityStatus.id} />
          <Property label="CO2" value={eligibilityStatus.co2} />
          <Property label="Nom" value={eligibilityStatus.name} />
          <Property label="Dans un PDP" value={eligibilityStatus.inPDP ? 'Oui' : 'Non'} />
          <Property label="A un PDP" value={eligibilityStatus.hasPDP ? 'Oui' : 'Non'} />
          <Property label="Distance" value={eligibilityStatus.distance} />
          <Property label="Classe" value={eligibilityStatus.isClasse ? 'Oui' : 'Non'} />
          <Property label="Taux ENRR" value={eligibilityStatus.tauxENRR} />
          <Property label="Éligibilité" value={eligibilityStatus.isEligible ? 'Oui' : 'Non'} />
          <Property label="Réseau futur" value={eligibilityStatus.futurNetwork ? 'Oui' : 'Non'} />
          <Property label="Gestionnaire" value={eligibilityStatus.gestionnaire} />
          <Property label="Réseau sans tracé" value={eligibilityStatus.hasNoTraceNetwork ? 'Oui' : 'Non'} />
          <Property label="Distance très éligible" value={eligibilityStatus.veryEligibleDistance} />
        </TwoColumns>
      ) : (
        <TwoColumns>
          <Property label="Non éligible" value="Aucun réseau à proximité " />
        </TwoColumns>
      )}
    </>
  );
}
