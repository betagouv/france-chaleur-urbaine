import {
  Button,
  ButtonGroup,
  ModalClose,
  ModalContent,
} from '@dataesr/react-dsfr';
import CarteFrance, { DonneeParTerritoire, ModeCarte } from './CarteFrance';
import { useEffect, useMemo, useState } from 'react';
import {
  BigBlueNumber,
  BigBlueText,
  Bin,
  BlackNumber,
  BlackNumbersLine,
  BlackText,
  BlueNumber,
  BlueText,
  DistanceLineText,
  FirstColumn,
  GreyNumber,
  GreyText,
  HorizontalSeparator,
  LayoutTwoColumns,
  LegendSourceLine,
  LegendTitle,
  ModalContentWrapper,
  SecondColumn,
  SourceLink,
  SpinnerWrapper,
  StyledModal,
} from './ModalCarteFrance.style';
import { Oval } from 'react-loader-spinner';
import { prettyFormatNumber } from '@utils/strings';

const minFillColor = '#E2E3EE';
const maxFillColor = '#4550E5';
const nbBins = 5;

export type DistanceReseau = '50m' | '100m' | '150m';
export type BatimentLogement = 'batiments' | 'logements';
export type Territoire = 'national' | 'regional' | 'departemental';

type Props = {
  isOpen: boolean;
  onClose: (...args: any[]) => any;
};
function ModalCarteFrance(props: Props) {
  const [territoire, setTerritoire] = useState<Territoire>('departemental');
  const [distanceReseau, setDistanceReseau] = useState<DistanceReseau>('100m');
  const [modeBatimentLogement, setModeBatimentLogement] =
    useState<BatimentLogement>('logements');
  const [statsData, setStatsData] = useState<BDNBStats | null>(null);
  const [selectedData, setSelectedData] = useState<
    BDNBStatsNational | BDNBStatsParRegion | BDNBStatsParDepartement | null
  >(null);

  useEffect(() => {
    if (statsData !== null && territoire === 'national') {
      setSelectedData(statsData.national);
    }
  }, [statsData, territoire]);

  useEffect(() => {
    async function fetchStats() {
      const [statsNational, statsParRegion, statsParDepartement] =
        await Promise.all([
          (async () => {
            const res = await fetch('/data/stats-bdnb-2022-national.json');
            return (await res.json()) as BDNBStatsNational;
          })(),
          (async () => {
            const res = await fetch('/data/stats-bdnb-2022-regions.json');
            return (await res.json()) as BDNBStatsParRegion[];
          })(),
          (async () => {
            const res = await fetch('/data/stats-bdnb-2022-departements.json');
            return (await res.json()) as BDNBStatsParDepartement[];
          })(),
        ]);
      setStatsData({
        national: statsNational,
        regional: statsParRegion,
        departemental: statsParDepartement,
      });
    }
    if (props.isOpen && !statsData) {
      fetchStats();
    }
  }, [props.isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const { modeCarte, territoireId } = getTerritoireToMapConfig(territoire);

  const { dataBins, donneesParTerritoire } = useMemo(() => {
    if (!statsData) {
      return {};
    }
    const source = statsData[modeCarte];

    const dataBins = calculateBins(
      source.map(
        (statsParTerritoire) =>
          statsParTerritoire?.[distanceReseau]?.[`nb_${modeBatimentLogement}`]
      ),
      nbBins,
      minFillColor,
      maxFillColor
    ).reverse();

    const donneesParTerritoire = source.reduce((acc, donneesParTerritoire) => {
      const value =
        donneesParTerritoire?.[distanceReseau]?.[`nb_${modeBatimentLogement}`];
      return {
        ...acc,
        [donneesParTerritoire[territoireId]]: {
          value,
          color: (
            dataBins.find(
              (bin) => bin.minValue <= value && value <= bin.maxValue
            ) as Bin
          )?.color,
        },
      };
    }, {} as DonneeParTerritoire);

    return {
      dataBins,
      donneesParTerritoire,
    };
  }, [
    statsData,
    modeCarte,
    territoireId,
    distanceReseau,
    modeBatimentLogement,
  ]);

  return (
    <StyledModal
      isOpen={props.isOpen}
      hide={() => {
        props.onClose();
      }}
    >
      <ModalClose>Fermer</ModalClose>
      <ModalContent>
        {!statsData || !donneesParTerritoire ? (
          <SpinnerWrapper>
            <Oval height={60} width={60} />
          </SpinnerWrapper>
        ) : (
          <ModalContentWrapper>
            <ButtonGroup size="sm" isInlineFrom="xs">
              <Button
                secondary={territoire !== 'national'}
                onClick={() => {
                  setTerritoire('national');
                  setSelectedData(statsData.national);
                }}
              >
                National
              </Button>
              <Button
                secondary={territoire !== 'regional'}
                onClick={() => {
                  setTerritoire('regional');

                  // sélectionne la région si on vient d'un département
                  if (territoire === 'departemental' && selectedData) {
                    setSelectedData(
                      statsData.regional.find(
                        (r) =>
                          r.region_code ===
                          (selectedData as BDNBStatsParDepartement).region_code
                      )!
                    );
                  }
                  // réinitialise la sélection si on vient de national
                  if (territoire === 'national') {
                    setSelectedData(null);
                  }
                }}
              >
                Régional
              </Button>
              <Button
                secondary={territoire !== 'departemental'}
                onClick={() => {
                  setTerritoire('departemental');

                  // réinitialise la sélection si on vient de national ou régional
                  if (territoire !== 'departemental') {
                    setSelectedData(null);
                  }
                }}
              >
                Départemental
              </Button>
            </ButtonGroup>
            <HorizontalSeparator />
            <LayoutTwoColumns>
              <FirstColumn>
                <BigBlueText>
                  {(territoire === 'departemental'
                    ? selectedData?.departement_nom
                    : territoire === 'regional'
                    ? selectedData?.region_nom
                    : 'France') ?? 'Cliquer sur la carte'}
                </BigBlueText>
                <BlackNumbersLine>
                  <div>
                    <BlackNumber>
                      {prettyFormatNumber(selectedData?.nb_reseaux) ?? '--'}
                    </BlackNumber>
                    <BlackText>réseaux de chaleur</BlackText>
                  </div>
                  <div>
                    <BlackNumber>
                      {selectedData?.taux_enrr
                        ? `${prettyFormatNumber(selectedData?.taux_enrr)}%`
                        : '--'}
                    </BlackNumber>
                    <BlackText>d'EnR&R en moyenne</BlackText>
                  </div>
                </BlackNumbersLine>
                <HorizontalSeparator className="fr-mt-1w" />
                <DistanceLineText>
                  Distance au réseau le plus proche&nbsp;:
                </DistanceLineText>
                <ButtonGroup size="sm" isInlineFrom="xs">
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
                <ButtonGroup size="sm" isInlineFrom="xs">
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
                <BigBlueNumber className="fr-mt-2w">
                  {prettyFormatNumber(
                    selectedData?.[distanceReseau]?.[
                      `nb_${modeBatimentLogement}`
                    ]
                  ) ?? '--'}
                </BigBlueNumber>
                <BlueText>
                  {getBatimentLogementLabel(modeBatimentLogement)} raccordables
                  identifiés
                  {modeBatimentLogement === 'logements' && (
                    <>
                      , soit{' '}
                      {selectedData
                        ? getConsoAnnuelleGWhLogements(
                            selectedData?.[distanceReseau]?.[
                              `nb_${modeBatimentLogement}`
                            ] ?? 0
                          )
                        : '--'}{' '}
                      GWh
                      <br />
                      de consommation annuelle environ
                    </>
                  )}
                </BlueText>
                <BlueText className="fr-mt-1w">dont&nbsp;:</BlueText>
                <BlueNumber className="fr-mt-1w">
                  {prettyFormatNumber(
                    selectedData?.[distanceReseau]?.[modeBatimentLogement]
                      ?.collectif_gaz
                  ) ?? '--'}
                </BlueNumber>
                <BlueText>
                  {getBatimentLogementLabel(modeBatimentLogement)} chauffés au
                  gaz collectif
                </BlueText>
                <BlueNumber className="fr-mt-1w">
                  {prettyFormatNumber(
                    selectedData?.[distanceReseau]?.[modeBatimentLogement]
                      ?.collectif_fioul
                  ) ?? '--'}
                </BlueNumber>
                <BlueText>
                  {getBatimentLogementLabel(modeBatimentLogement)} chauffés au
                  fioul collectif
                </BlueText>
                <GreyText className="fr-mt-2w">et&nbsp;:</GreyText>
                <GreyNumber>
                  {prettyFormatNumber(
                    selectedData?.[distanceReseau]?.[modeBatimentLogement]
                      ?.individuel_gaz
                  ) ?? '--'}
                </GreyNumber>
                <GreyText>
                  {getBatimentLogementLabel(modeBatimentLogement)} chauffés au
                  gaz individuel
                </GreyText>
              </FirstColumn>
              <SecondColumn>
                <CarteFrance
                  mode={modeCarte}
                  donneesParTerritoire={donneesParTerritoire}
                  onTerritoireSelect={(selectedTerritoireId) => {
                    // passe automatiquement en régional quand on sélectionne une région
                    if (territoire === 'national') {
                      setTerritoire('regional');
                    }
                    setSelectedData(
                      statsData[modeCarte].find(
                        (territoire) =>
                          territoire[territoireId] === selectedTerritoireId
                      )!
                    );
                  }}
                />
                <LegendSourceLine>
                  <div>
                    <LegendTitle>
                      Nombre de {getBatimentLogementLabel(modeBatimentLogement)}
                      <br />
                      raccordables
                    </LegendTitle>
                    {dataBins?.map((bin, i) => (
                      <Bin key={i} color={bin.color}>
                        {i === 0
                          ? `≥ ${prettyFormatNumber(bin.minValue)}`
                          : `de ${prettyFormatNumber(
                              bin.minValue
                            )} à ${prettyFormatNumber(bin.maxValue)}`}
                      </Bin>
                    ))}
                  </div>
                  <SourceLink
                    href="/documentation/FCU_sources_donnees_agregees.pdf"
                    target="_blank"
                  >
                    Sources
                  </SourceLink>
                </LegendSourceLine>
              </SecondColumn>
            </LayoutTwoColumns>
          </ModalContentWrapper>
        )}
      </ModalContent>
    </StyledModal>
  );
}

export default ModalCarteFrance;

type BDNBStats = {
  national: BDNBStatsNational;
  regional: BDNBStatsParRegion[];
  departemental: BDNBStatsParDepartement[];
};

type BDNBStatsNational = BDNBStatsParTerritoire;

type BDNBStatsParRegion = BDNBStatsParTerritoire & {
  region_code: string;
  region_nom: string;
};

type BDNBStatsParDepartement = BDNBStatsParTerritoire & {
  departement_code: string;
  departement_nom: string;
  region_code: string;
  region_nom: string;
};

type BDNBStatsParTerritoire = {
  nb_reseaux: number;
  taux_enrr: number | null;
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
  collectif_fioul: number;
  collectif_gaz: number;
  individuel_gaz: number;
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
  const sortedData = [...data]
    .filter((v) => v !== undefined && v !== null)
    .sort((a, b) => a - b);
  const binSize = Math.ceil(sortedData.length / numberOfBins);

  const bins = Array.from({ length: numberOfBins }, (_, i) => {
    const colorRatio = i / (numberOfBins - 1);
    return {
      minValue: sortedData[i * binSize],
      maxValue: sortedData[Math.min((i + 1) * binSize, sortedData.length) - 1],
      color: interpolateColor(minColor, maxColor, colorRatio),
    };
  });
  // borne min à zéro pour un meilleur affichage
  bins[0].minValue = 0;
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

const consoAnnuelleMWhParLogement = 10;
function getConsoAnnuelleGWhLogements(nbLogements: number): number {
  return Math.ceil((nbLogements * consoAnnuelleMWhParLogement) / 1000);
}

function getBatimentLogementLabel(type: BatimentLogement): string {
  switch (type) {
    case 'batiments':
      return 'bâtiments';
    case 'logements':
      return 'logements';
  }
}

function getTerritoireToMapConfig(territoire: Territoire): {
  territoireId: string;
  modeCarte: ModeCarte;
} {
  switch (territoire) {
    case 'national':
    case 'regional':
      return {
        modeCarte: 'regional',
        territoireId: 'region_code',
      };
    case 'departemental':
      return {
        modeCarte: 'departemental',
        territoireId: 'departement_code',
      };
  }
}
