import Badge from '@codegouvfr/react-dsfr/Badge';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { useMemo, useState } from 'react';

import Box, { ResponsiveRow } from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import { trackEvent } from '@/modules/analytics/client';
import { isDefined } from '@/utils/core';

import { prixSpotCEE } from './Simulator';

type TypeBatiment = 'residentiel' | 'tertiaire';

type FormState = {
  typeBatiment: TypeBatiment;
  nbLogements?: number;
  surface?: number;
};

interface SimulateurCoutRaccordementProps {
  typeBatiment?: TypeBatiment;
  embedded?: boolean;
}

/**
 * Simulateur du coût de raccordement selon le nombre de logements si batiment résidentiel ou
 * la surface si batiment tertiaire.
 */
const SimulateurCoutRaccordement = (props: SimulateurCoutRaccordementProps) => {
  const [formState, setFormState] = useState<FormState>({
    typeBatiment: props.typeBatiment ?? 'residentiel',
  });
  const [hasUsedFeature, setHasUsedFeature] = useState(false);

  function updateState<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    if (!hasUsedFeature) {
      trackEvent('Outils|Simulation coût raccordement');
    }
    setHasUsedFeature(true);
    setFormState((state) => ({
      ...state,
      [key]: value,
    }));
  }

  const montantAide = useMemo(() => {
    const value = formState.typeBatiment === 'residentiel' ? formState.nbLogements : formState.surface;
    if (!value) {
      return null;
    }
    return (
      (formState.typeBatiment === 'residentiel'
        ? value <= 125
          ? 12000
          : 77 * value + 2300
        : value <= 7500
          ? 11000
          : 1.07 * value + 3000) *
      0.75 *
      prixSpotCEE
    );
  }, [formState]);

  const montantCouts = useMemo(() => {
    return formState.typeBatiment === 'residentiel'
      ? isDefined(formState.nbLogements) && formState.nbLogements > 0
        ? getCoutRaccordementResidentiel(formState.nbLogements)
        : null
      : isDefined(formState.surface) && formState.surface > 0
        ? getCoutRaccordementTertiaire(formState.surface)
        : null;
  }, [formState]);

  const montantCoutsApresAide = useMemo(() => {
    if (Array.isArray(montantCouts) && isDefined(montantAide)) {
      return [Math.max(0, montantCouts[0] - montantAide), Math.max(0, montantCouts[1] - montantAide)];
    }
    return null;
  }, [montantCouts, montantAide]);

  const montantCoutsParLogementApresAide = useMemo(() => {
    if (Array.isArray(montantCoutsApresAide) && isDefined(formState.nbLogements)) {
      return [montantCoutsApresAide[0] / formState.nbLogements, montantCoutsApresAide[1] / formState.nbLogements];
    }
    return null;
  }, [formState, montantAide]);

  return (
    <Box border="1px solid #e7e7e7">
      <ResponsiveRow breakpoint="sm">
        <Box flex p="3w">
          <Badge severity="new" noIcon>
            {/* the dsfr does not handle custom icons */}
            <Icon name="fr-icon-money-euro-circle-line" size="sm" mr="1v" />
            Simulateur
          </Badge>
          <Heading as="h6" mt="1w" mb="1w">
            Estimer le coût d’un raccordement*
          </Heading>
          <Box mb="3w">pour une longueur de branchement de 50 m</Box>
          <Select
            label="Type de bâtiment"
            options={[
              {
                label: 'Résidentiel',
                value: 'residentiel',
              },
              {
                label: 'Tertiaire',
                value: 'tertiaire',
              },
            ]}
            nativeSelectProps={{
              onChange: (e) => {
                updateState('typeBatiment', e.target.value as TypeBatiment);
                updateState(e.target.value === 'residentiel' ? 'nbLogements' : 'surface', undefined);
              },
              value: formState.typeBatiment,
            }}
          />
          {formState.typeBatiment === 'residentiel' ? (
            <Input
              key="nbLogements"
              label="Nombre de logements"
              nativeInputProps={{
                min: 0,
                onChange: (e) => updateState('nbLogements', parseInt(e.target.value, 10)),
                type: 'number',
              }}
            />
          ) : (
            <Input
              key="surface"
              label="Surface (m²)"
              nativeInputProps={{
                min: 0,
                onChange: (e) => updateState('surface', parseInt(e.target.value, 10)),
                type: 'number',
              }}
            />
          )}
          <Text size="sm">
            *montants donnés à titre indicatif.
            {props.embedded && (
              <>
                {' '}
                En savoir plus sur notre <Link href="/ressources/cout-raccordement#contenu">article dédié</Link>.
              </>
            )}
          </Text>
        </Box>
        <Box flex backgroundColor="grey-975-75" p="3w">
          <Text fontWeight="bold" textTransform="uppercase">
            Coût du raccordement
          </Text>
          {montantCouts === outOfRangeValue ? (
            <Box mt="2w">
              <Badge severity="warning">
                Le simulateur n'est pour le moment pas disponible pour des bâtiments de plus de{' '}
                {formState.typeBatiment === 'residentiel' ? '330 logements' : '20 000 m²'}
              </Badge>
            </Box>
          ) : (
            <>
              <Heading as="h6" mt="2w">
                Entre {prettyPrintCout(montantCouts?.[0])} et {prettyPrintCout(montantCouts?.[1])}
              </Heading>
              <Box border="1px solid #e7e7e7" my="3w" />
              <Text fontWeight="bold" textTransform="uppercase">
                Montant du coup de pouce
              </Text>
              <Heading as="h6" mt="2w">
                {prettyPrintCout(montantAide)}
              </Heading>
              <Box border="1px solid #e7e7e7" my="3w" />
              <Badge severity="info">Après déduction du coup de pouce</Badge>
              <Heading as="h6" mb="0" mt="1w">
                {montantCoutsApresAide?.[0] === 0 && montantCoutsApresAide?.[1] === 0 ? (
                  <>Raccordement gratuit&nbsp;!</>
                ) : (
                  <>
                    Entre {prettyPrintCout(montantCoutsApresAide?.[0])} et {prettyPrintCout(montantCoutsApresAide?.[1])}
                  </>
                )}
              </Heading>

              {formState.typeBatiment === 'residentiel' && Array.isArray(montantCoutsParLogementApresAide) && (
                <Text mt="1w">
                  Soit {prettyPrintCout(montantCoutsParLogementApresAide[0])} à {prettyPrintCout(montantCoutsParLogementApresAide[1])} par
                  logement
                </Text>
              )}
            </>
          )}
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default SimulateurCoutRaccordement;

function prettyPrintCout(v: number | undefined | null) {
  if (isDefined(v)) {
    return v.toLocaleString('fr-FR', {
      currency: 'EUR',
      maximumFractionDigits: 0,
      style: 'currency',
    });
  }
  return '- €';
}

interface RangeParams {
  a: number;
  b: number;
}

interface IntervalleCoutRaccordement {
  min: number;
  max: number;
  lowRange: RangeParams;
  highRange: RangeParams;
}

// données provenant du fichier coef_couts.xlsx https://trello.com/c/Kni8TTuQ/1201-int%C3%A9gration-co%C3%BBt-raccordement
const intervallesCoutsRaccordementResidentiel: IntervalleCoutRaccordement[] = [
  {
    highRange: { a: 0, b: 0 },
    lowRange: { a: 0, b: 0 },
    max: 0,
    min: 0,
  },
  {
    highRange: { a: 0, b: 111269.4 },
    lowRange: { a: 0, b: 74179.6 },
    max: 10,
    min: 1,
  },
  {
    highRange: { a: 0, b: 111269.4 },
    lowRange: { a: 0, b: 74179.6 },
    max: 25,
    min: 10,
  },
  {
    highRange: { a: 473.616, b: 99429 },
    lowRange: { a: 315.744, b: 66286 },
    max: 42,
    min: 25,
  },
  {
    highRange: { a: 564.696, b: 95634 },
    lowRange: { a: 376.464, b: 63756 },
    max: 58,
    min: 42,
  },
  {
    highRange: { a: 406.824, b: 104843.2 },
    lowRange: { a: 271.216, b: 69895.47 },
    max: 83,
    min: 58,
  },
  {
    highRange: { a: 367.9632, b: 108081.6 },
    lowRange: { a: 245.3088, b: 72054.4 },
    max: 125,
    min: 83,
  },
  {
    highRange: { a: 422.6112, b: 101250.6 },
    lowRange: { a: 281.7408, b: 67500.4 },
    max: 167,
    min: 125,
  },
  {
    highRange: { a: 462.6864, b: 94571.4 },
    lowRange: { a: 308.4576, b: 63047.6 },
    max: 250,
    min: 167,
  },
  {
    highRange: { a: 391.644, b: 112332 },
    lowRange: { a: 261.096, b: 74888 },
    max: 333,
    min: 250,
  },
];

const intervallesCoutsRaccordementTertiaire: IntervalleCoutRaccordement[] = [
  {
    highRange: { a: 0, b: 0 },
    lowRange: { a: 0, b: 0 },
    max: 0,
    min: 0,
  },
  {
    highRange: { a: 0, b: 111269.4 },
    lowRange: { a: 0, b: 74179.6 },
    max: 200,
    min: 1,
  },
  {
    highRange: { a: 0, b: 111269.4 },
    lowRange: { a: 0, b: 74179.6 },
    max: 600,
    min: 200,
  },
  {
    highRange: { a: 0, b: 111269.4 },
    lowRange: { a: 0, b: 74179.6 },
    max: 1000,
    min: 600,
  },
  {
    highRange: { a: 0, b: 111269.4 },
    lowRange: { a: 0, b: 74179.6 },
    max: 1500,
    min: 1000,
  },
  {
    highRange: { a: 7.8936, b: 99429 },
    lowRange: { a: 5.2624, b: 66286 },
    max: 2500,
    min: 1500,
  },
  {
    highRange: { a: 9.4116, b: 95634 },
    lowRange: { a: 6.2744, b: 63756 },
    max: 3500,
    min: 2500,
  },
  {
    highRange: { a: 6.7804, b: 104843.2 },
    lowRange: { a: 4.52027, b: 69895.47 },
    max: 5000,
    min: 3500,
  },
  {
    highRange: { a: 6.13272, b: 108081.6 },
    lowRange: { a: 4.08848, b: 72054.4 },
    max: 7500,
    min: 5000,
  },
  {
    highRange: { a: 7.04352, b: 101250.6 },
    lowRange: { a: 4.69568, b: 67500.4 },
    max: 10000,
    min: 7500,
  },
  {
    highRange: { a: 7.71144, b: 94571.4 },
    lowRange: { a: 5.14096, b: 63047.6 },
    max: 15000,
    min: 10000,
  },
  {
    highRange: { a: 6.5274, b: 112332 },
    lowRange: { a: 4.3516, b: 74888 },
    max: 20000,
    min: 15000,
  },
];

function getCoutRaccordementResidentiel(nbLogements: number): [number, number] | typeof outOfRangeValue {
  const intervalle = intervallesCoutsRaccordementResidentiel.find(
    (intervalle) => intervalle.min <= nbLogements && nbLogements <= intervalle.max
  );
  if (!intervalle) {
    return outOfRangeValue;
  }
  return [intervalle.lowRange.a * nbLogements + intervalle.lowRange.b, intervalle.highRange.a * nbLogements + intervalle.highRange.b];
}

const outOfRangeValue: unique symbol = Symbol('outOfRangeValue');

function getCoutRaccordementTertiaire(surface: number): [number, number] | typeof outOfRangeValue {
  const intervalle = intervallesCoutsRaccordementTertiaire.find((intervalle) => intervalle.min <= surface && surface <= intervalle.max);
  if (!intervalle) {
    return outOfRangeValue;
  }
  return [intervalle.lowRange.a * surface + intervalle.lowRange.b, intervalle.highRange.a * surface + intervalle.highRange.b];
}
