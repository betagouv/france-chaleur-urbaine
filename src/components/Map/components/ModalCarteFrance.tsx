import {
  Button,
  ButtonGroup,
  ModalClose,
  ModalContent,
} from '@dataesr/react-dsfr';
import CarteFrance, { DonneeParDepartement, Mode } from './CarteFrance';
import { useEffect, useMemo, useState } from 'react';
import {
  Bin,
  HorizontalSeparator,
  Layout,
  LegendTitle,
  SpinnerWrapper,
  StyledModal,
} from './ModalCarteFrance.style';
import departements from '@etalab/decoupage-administratif/data/departements.json';
import regions from '@etalab/decoupage-administratif/data/regions.json';
import { Oval } from 'react-loader-spinner';

const minFillColor = '#E2E3EE';
const maxFillColor = '#4550E5';
const nbBins = 5;

export type DistanceReseau = '50m' | '100m' | '150m';
export type BatimentLogement = 'batiments' | 'logements';

type Props = {
  isOpen: boolean;
  onClose: (...args: any[]) => any;
};
function ModalCarteFrance(props: Props) {
  const [modeCarte, setModeCarte] = useState<Mode>('departemental');
  const [distanceReseau, setDistanceReseau] = useState<DistanceReseau>('100m');
  const [modeBatimentLogement, setModeBatimentLogement] =
    useState<BatimentLogement>('logements');
  const [statsData, setStatsData] = useState<BDNBStatsParDepartement[] | null>(
    null
  );
  const [selectedData, setSelectedData] =
    useState<BDNBStatsParDepartement | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch('/data/stats-bdnb-2022.json');
      setStatsData((await res.json()) as BDNBStatsParDepartement[]);
    }
    if (props.isOpen && !statsData) {
      fetchStats();
    }
  }, [props.isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const { dataBins, donneesParDepartement } = useMemo(() => {
    if (!statsData) {
      return {};
    }
    const dataBins = calculateBins(
      statsData.map(
        (starsParDepartement) =>
          starsParDepartement?.[distanceReseau]?.[
            `nb_${modeBatimentLogement}`
          ] as number
      ),
      nbBins,
      minFillColor,
      maxFillColor
    ).reverse();

    const donneesParDepartement = statsData.reduce(
      (acc, dataParDepartement) => {
        const value =
          dataParDepartement?.[distanceReseau]?.[`nb_${modeBatimentLogement}`];
        return {
          ...acc,
          [dataParDepartement.departement]: {
            value,
            color: (
              dataBins.find(
                (bin) => bin.minValue <= value && value <= bin.maxValue
              ) as Bin
            )?.color,
          },
        };
      },
      {} as DonneeParDepartement
    );

    return {
      dataBins,
      donneesParDepartement,
    };
  }, [statsData, distanceReseau, modeBatimentLogement]);

  return (
    <StyledModal
      size="lg"
      isOpen={props.isOpen}
      hide={() => {
        props.onClose();
      }}
    >
      <ModalClose>Fermer</ModalClose>
      <ModalContent>
        {!statsData || !donneesParDepartement ? (
          <SpinnerWrapper>
            <Oval height={40} width={40} />
          </SpinnerWrapper>
        ) : (
          <Layout>
            <div>
              <ButtonGroup isInlineFrom="xs">
                <Button
                  secondary={modeCarte !== 'national'}
                  onClick={() => setModeCarte('national')}
                >
                  National
                </Button>
                <Button
                  secondary={modeCarte !== 'regional'}
                  onClick={() => setModeCarte('regional')}
                >
                  Régional
                </Button>
                <Button
                  secondary={modeCarte !== 'departemental'}
                  onClick={() => setModeCarte('departemental')}
                >
                  Départemental
                </Button>
              </ButtonGroup>
              <HorizontalSeparator />
              <div>
                <div>
                  {(modeCarte === 'departemental'
                    ? departements.find(
                        (d) => d.code === selectedData?.departement
                      )?.nom
                    : modeCarte === 'regional'
                    ? regions.find((d) => d.code === selectedData?.departement) // FIXME récupérer les données par région également
                        ?.nom
                    : 'France') ?? '-'}
                </div>
                <div>{selectedData?.departement ?? '-'} réseaux de chaleur</div>
                <div>{selectedData?.departement ?? '-'} d'EnR&R en moyenne</div>
                <HorizontalSeparator />
                <div>Distance au réseau le plus proche&nbsp;:</div>
                <ButtonGroup isInlineFrom="xs">
                  <Button
                    secondary={distanceReseau !== '50m'}
                    onClick={() => setDistanceReseau('50m')}
                  >
                    &lt;50 m
                  </Button>
                  <Button
                    secondary={distanceReseau !== '100m'}
                    onClick={() => setDistanceReseau('100m')}
                  >
                    &lt;100 m
                  </Button>
                  <Button
                    secondary={distanceReseau !== '150m'}
                    onClick={() => setDistanceReseau('150m')}
                  >
                    &lt;150 m
                  </Button>
                </ButtonGroup>
                <ButtonGroup isInlineFrom="xs">
                  <Button
                    secondary={modeBatimentLogement !== 'batiments'}
                    onClick={() => setModeBatimentLogement('batiments')}
                  >
                    Bâtiments
                  </Button>
                  <Button
                    secondary={modeBatimentLogement !== 'logements'}
                    onClick={() => setModeBatimentLogement('logements')}
                  >
                    Logements
                  </Button>
                </ButtonGroup>
                <div>
                  {selectedData?.[distanceReseau]?.[
                    `nb_${modeBatimentLogement}`
                  ] ?? '-'}{' '}
                  {modeBatimentLogement} raccordables
                </div>
                <div>dont&nbsp;:</div>
                <div>
                  {selectedData?.[distanceReseau]?.[modeBatimentLogement]
                    ?.collectif_gaz ?? '-'}{' '}
                  {modeBatimentLogement} chauffés au gaz collectif
                </div>
                <div>
                  {selectedData?.[distanceReseau]?.[modeBatimentLogement]
                    ?.collectif_fioul ?? '-'}{' '}
                  {modeBatimentLogement} chauffés au fioul collectif
                </div>
                <div>et&nbsp;:</div>
                <div>
                  {selectedData?.[distanceReseau]?.[modeBatimentLogement]
                    ?.individuel_gaz ?? '-'}{' '}
                  {modeBatimentLogement} chauffés au gaz individuel
                </div>
              </div>
            </div>
            <div className="fr-col">
              <CarteFrance
                mode={modeCarte}
                donneesParDepartement={donneesParDepartement}
                onTerritoireSelect={(departementOuRegion) =>
                  setSelectedData(
                    statsData.find(
                      (r) => r.departement === departementOuRegion
                    )!
                  )
                }
              />
              <div>
                <LegendTitle>
                  Nombre de {modeBatimentLogement}
                  <br />
                  raccordables
                </LegendTitle>
                {dataBins?.map((bin, i) => (
                  <Bin key={i} color={bin.color}>
                    {i === 0
                      ? `> ${bin.minValue}`
                      : `de ${bin.minValue} à ${bin.maxValue}`}
                  </Bin>
                ))}
              </div>
            </div>
          </Layout>
        )}
      </ModalContent>
    </StyledModal>
  );
}

export default ModalCarteFrance;

type BDNBStatsParDepartement = {
  departement: string;
  '50m': BDNBStatsParDistanceRDC;
  '100m': BDNBStatsParDistanceRDC;
  '150m': BDNBStatsParDistanceRDC;
};

type BDNBStatsParDistanceRDC = {
  nb_batiments: number;
  nb_logements: number;
  batiments: BDNBStatsParTypeChauffage;
  logements: BDNBStatsParTypeChauffage;
};

type BDNBStatsParTypeChauffage = {
  individuel_fioul: number;
  individuel_gaz: number;
  collectif_fioul: number;
  collectif_gaz: number;
};

type Bin = {
  minValue: number;
  maxValue: number;
  color: string;
};

export function calculateBins(
  data: number[],
  numberOfBins: number,
  minColor: string,
  maxColor: string
): Bin[] {
  const dataMin = 0;
  const dataMax = data
    .filter((v) => !!v) // strip null and undefined values
    .reduce((acc, v) => Math.max(acc, v), 0); // TODO probablement arrondir
  const binSize = Math.round((dataMax - dataMin) / numberOfBins);

  const bins = Array.from({ length: numberOfBins }, (_, i) => {
    const minValue: number = dataMin + i * binSize;
    const maxValue: number = minValue + binSize;

    const colorRatio = i / (numberOfBins - 1);
    const color: string = interpolateColor(minColor, maxColor, colorRatio);

    return { minValue, maxValue, color };
  });
  return bins;
}

/**
 * Create a new color between 2 colors with a ratio.
 */
function interpolateColor(
  color1: string,
  color2: string,
  ratio: number
): string {
  const r = Math.ceil(
    parseInt(color1.slice(1, 3), 16) * (1 - ratio) +
      parseInt(color2.slice(1, 3), 16) * ratio
  );
  const g = Math.ceil(
    parseInt(color1.slice(3, 5), 16) * (1 - ratio) +
      parseInt(color2.slice(3, 5), 16) * ratio
  );
  const b = Math.ceil(
    parseInt(color1.slice(5, 7), 16) * (1 - ratio) +
      parseInt(color2.slice(5, 7), 16) * ratio
  );

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function hex(i: number): string {
  return `${i < 16 ? '0' : ''}${i.toString(16)}`;
}
