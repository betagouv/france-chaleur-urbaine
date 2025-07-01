import dayjs from 'dayjs';

import Tooltip from '@/components/ui/Tooltip';
import { upperCaseFirstChar } from '@/utils/strings';
import { structureTypes } from '@/validation/user';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const testsAdressesLayerStyle = {
  eligible: {
    fill: { color: '#00efaf', size: 4 },
    stroke: { color: '#00b894', size: 2 },
  },
  notEligible: {
    fill: { color: '#ff6b6b', size: 4 },
    stroke: { color: '#e74c3c', size: 2 },
  },
};

export const testsAdressesLayersSpec = [
  {
    sourceId: 'testsAdresses',
    source: {
      type: 'vector',
      tiles: [`/api/map/testsAdresses/{z}/{x}/{y}`],
    },
    layers: [
      {
        id: 'testsAdresses',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['get', 'isEligible'],
            testsAdressesLayerStyle.eligible.fill.color,
            testsAdressesLayerStyle.notEligible.fill.color,
          ],
          'circle-stroke-color': [
            'case',
            ['get', 'isEligible'],
            testsAdressesLayerStyle.eligible.stroke.color,
            testsAdressesLayerStyle.notEligible.stroke.color,
          ],
          'circle-radius': ifHoverElse(testsAdressesLayerStyle.eligible.fill.size + 2, testsAdressesLayerStyle.eligible.fill.size),
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
  tests: string;
};

export type Test = {
  id: string;
  name: string;
  created_at: string;
  user: TestUser;
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
  isBasedOnIris: boolean;
  hasNoTraceNetwork: boolean;
  veryEligibleDistance: number | null;
};

function Popup(
  { ban_address, eligibility_status: eligibility_status_string, tests: tests_string }: TestAdresse,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  const eligibilityStatus = JSON.parse(eligibility_status_string) as EligibilityStatus;
  const tests: Test[] = tests_string ? JSON.parse(tests_string) : [];

  const interestedUsers = tests.reduce(
    (acc, { user, ...test }) => {
      acc[user.id] = acc[user.id] || {
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        gestionnaires: user.gestionnaires,
        structure_name: user.structure_name,
        structure_type: user.structure_type,
        phone: user.phone,
        tests: [],
      };

      acc[user.id].tests.push(test);
      return acc;
    },
    {} as Record<string, TestUser & { tests: Omit<Test, 'user'>[] }>
  );

  return (
    <>
      <Title>{ban_address}</Title>
      <h6 className="text-lg !mb-0">Utilisateurs interessés ({Object.keys(interestedUsers).length})</h6>
      <TwoColumns>
        {Object.entries(interestedUsers)
          .sort((a, b) => a[1].first_name?.toLowerCase().localeCompare(b[1].first_name?.toLowerCase() || '') || 0)
          ?.map(([id, { first_name, last_name, role, structure_name, structure_type, phone, gestionnaires, tests }]) => {
            const name = first_name || last_name ? `${upperCaseFirstChar(first_name)} ${upperCaseFirstChar(last_name)}` : '';
            const roleLabel = role ? ` (${role})` : '';
            const phoneLabel = phone ? (
              <>
                - <a href={`tel:${phone}`}>{phone}</a>
              </>
            ) : (
              ''
            );

            return (
              <Property
                key={id}
                label={`${name}${roleLabel}${phoneLabel}`}
                value={
                  <Tooltip
                    title={tests.map(({ id: test_id, name, created_at }) => (
                      <div key={test_id} className="flex items-center gap-1 [&>div]:flex-1 [&>div:first-child]:whitespace-nowrap">
                        <Property label={name} value={dayjs(created_at).format('DD/MM/YYYY HH:mm')} />
                      </div>
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
        <Property label="Basé sur IRIS" value={eligibilityStatus.isBasedOnIris ? 'Oui' : 'Non'} />
        <Property label="Réseau sans tracé" value={eligibilityStatus.hasNoTraceNetwork ? 'Oui' : 'Non'} />
        <Property label="Distance très éligible" value={eligibilityStatus.veryEligibleDistance} />
      </TwoColumns>
    </>
  );
}
