import {
  Button,
  ButtonGroup,
  ModalClose,
  ModalContent,
} from '@dataesr/react-dsfr';
import CarteFrance, { DataByArea } from './CarteFrance';
import { useEffect, useMemo, useState } from 'react';
import {
  BigBlueNumber,
  ExtraBigBlueText,
  Bin as DataBin,
  BlackNumber,
  BlackNumbersLine,
  BlackText,
  BlueNumber,
  BlueText,
  DistanceLineText,
  FirstColumn,
  BigGreyNumber,
  GreyText,
  HorizontalSeparator,
  LayoutTwoColumns,
  LegendSourceLine,
  LegendTitle,
  ModalContentWrapper,
  SecondColumn,
  DataLink,
  SpinnerWrapper,
  StyledModal,
  BigBlueText,
  StyledIcon,
} from './ModalCarteFrance.style';
import { Oval } from 'react-loader-spinner';
import { prettyFormatNumber } from '@utils/strings';
import { fetchJSON } from '@utils/network';
import Tooltip from '@components/ui/Tooltip';

const minFillColor = '#E2E3EE';
const maxFillColor = '#4550E5';
const nbBins = 5;

export type DistanceReseau = '50m' | '100m' | '150m';
export type BatimentLogement = 'batiments' | 'logements';
export type Area = 'national' | 'regional' | 'departemental';

type Props = {
  isOpen: boolean;
  onClose: (...args: any[]) => any;
};
function ModalCarteFrance(props: Props) {
  const [area, setArea] = useState<Area>('national');
  const [distanceReseau, setDistanceReseau] = useState<DistanceReseau>('100m');
  const [modeBatimentLogement, setModeBatimentLogement] =
    useState<BatimentLogement>('logements');
  const [statsData, setStatsData] = useState<BDNBStats | null>(null);
  const [selectedData, setSelectedData] = useState<
    BDNBStatsNational | BDNBStatsParRegion | BDNBStatsParDepartement | null
  >(null);

  useEffect(() => {
    if (statsData !== null && area === 'national') {
      setSelectedData(statsData.national);
    }
  }, [statsData, area]);

  useEffect(() => {
    async function fetchStats() {
      const [statsNational, statsParRegion, statsParDepartement] =
        await Promise.all([
          fetchJSON<BDNBStatsNational>('/data/stats-bdnb-2022-national.json'),
          fetchJSON<BDNBStatsParRegion[]>('/data/stats-bdnb-2022-regions.json'),
          fetchJSON<BDNBStatsParDepartement[]>(
            '/data/stats-bdnb-2022-departements.json'
          ),
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

  const { areaMode, areaIdPropertyName, mapSourceData } = getAreaToMapConfig(
    area,
    statsData
  );

  const { dataBins, dataByArea } = useMemo(() => {
    if (!mapSourceData) {
      return {};
    }

    const dataBins = calculateBins(
      mapSourceData.map(
        (statsByArea) =>
          statsByArea?.[distanceReseau]?.[`nb_${modeBatimentLogement}`]
      ),
      nbBins,
      minFillColor,
      maxFillColor
    ).reverse();

    const dataByArea = (mapSourceData as any[]).reduce((acc, statsByArea) => {
      const value =
        statsByArea?.[distanceReseau]?.[`nb_${modeBatimentLogement}`];
      return {
        ...acc,
        [(statsByArea as any)[areaIdPropertyName]]: {
          value,
          color: (
            dataBins.find(
              (bin) => bin.minValue <= value && value <= bin.maxValue
            ) as DataBin
          )?.color,
        },
      };
    }, {} as DataByArea);

    return {
      dataBins,
      dataByArea,
    };
  }, [mapSourceData, areaIdPropertyName, distanceReseau, modeBatimentLogement]);

  return (
    <StyledModal
      isOpen={props.isOpen}
      hide={() => {
        props.onClose();
      }}
    >
      <ModalClose>Fermer</ModalClose>
      <ModalContent>
        {!statsData || !mapSourceData || !dataByArea ? (
          <SpinnerWrapper>
            <Oval height={60} width={60} />
          </SpinnerWrapper>
        ) : (
          <ModalContentWrapper>
            <ButtonGroup size="sm" isInlineFrom="xs">
              <Button
                secondary={area !== 'national'}
                onClick={() => {
                  setArea('national');
                  setSelectedData(statsData.national);
                }}
              >
                National
              </Button>
              <Button
                secondary={area !== 'regional'}
                onClick={() => {
                  setArea('regional');

                  // sélectionne la région si on vient d'un département
                  if (area === 'departemental' && selectedData) {
                    setSelectedData(
                      statsData.regional.find(
                        (r) =>
                          r.region_code ===
                          (selectedData as BDNBStatsParDepartement).region_code
                      )!
                    );
                  }
                  // réinitialise la sélection si on vient de national
                  if (area === 'national') {
                    setSelectedData(null);
                  }
                }}
              >
                Régional
              </Button>
              <Button
                secondary={area !== 'departemental'}
                onClick={() => {
                  setArea('departemental');

                  // réinitialise la sélection si on vient de national ou régional
                  if (area !== 'departemental') {
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
                <ExtraBigBlueText>
                  {(area === 'departemental'
                    ? (selectedData as any)?.departement_nom
                    : area === 'regional'
                    ? (selectedData as any)?.region_nom
                    : 'France') ?? 'Cliquer sur la carte'}
                </ExtraBigBlueText>
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
                        ? `${prettyFormatNumber(selectedData?.taux_enrr, 1)}%`
                        : '--'}
                    </BlackNumber>
                    <BlackText>d'EnR&R en moyenne</BlackText>
                  </div>
                </BlackNumbersLine>
                <HorizontalSeparator className="fr-mt-1w" />
                <BigBlueText>
                  Potentiel identifié
                  <Tooltip
                    icon={
                      <StyledIcon
                        size="1x"
                        name="ri-information-fill"
                        color="#959DB0"
                        marginLeft=".2em"
                        marginTop="-.5em"
                      />
                    }
                  >
                    Sur la base des réseaux de chaleur recensés sur la carte
                    France Chaleur Urbaine et des données bâtimentaires issues
                    de la Base de données nationale des bâtiments du CSTB et du
                    Registre national d'immatriculation des copropriétés de
                    l'ANAH.
                  </Tooltip>
                </BigBlueText>
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
                        ? prettyFormatNumber(
                            getConsoAnnuelleGWhLogements(
                              selectedData?.[distanceReseau]?.[
                                `nb_${modeBatimentLogement}`
                              ] ?? 0
                            )
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
                <BigGreyNumber className="fr-mt-3w">
                  {/* hack: nb_(batiments|logements) contient le total des collectifs gaz et fioul,
                      et on veut inclure individuel gas en plus */}
                  {selectedData
                    ? prettyFormatNumber(
                        selectedData[distanceReseau][
                          `nb_${modeBatimentLogement}`
                        ] +
                          selectedData[distanceReseau][modeBatimentLogement]
                            .individuel_gaz
                      )
                    : '--'}
                </BigGreyNumber>
                <GreyText>
                  {getBatimentLogementLabel(modeBatimentLogement)} raccordables
                  en intégrant les logements à chauffage au gaz individuel
                </GreyText>
              </FirstColumn>

              <SecondColumn>
                <CarteFrance
                  mode={areaMode}
                  dataByArea={dataByArea}
                  selectedAreaId={(selectedData as any)?.[areaIdPropertyName]}
                  onAreaSelect={(selectedAreaId) => {
                    // passe automatiquement en régional quand on sélectionne une région
                    if (area === 'national') {
                      setArea('regional');
                    }
                    setSelectedData(
                      areaMode === 'regional'
                        ? mapSourceData.find(
                            (area) =>
                              area[areaIdPropertyName] === selectedAreaId
                          )!
                        : mapSourceData.find(
                            (area) =>
                              area[areaIdPropertyName] === selectedAreaId
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
                      <DataBin key={i} color={bin.color}>
                        {i === 0
                          ? `≥ ${prettyFormatNumber(bin.minValue)}`
                          : `de ${prettyFormatNumber(
                              bin.minValue
                            )} à ${prettyFormatNumber(bin.maxValue)}`}
                      </DataBin>
                    ))}
                  </div>
                  <DataLink
                    href="/data/potentiel_identifie_FCU.xlsx"
                    target="_blank"
                  >
                    Données
                  </DataLink>
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

type BDNBStatsNational = BDNBStatsByArea;

type BDNBStatsParRegion = BDNBStatsByArea & {
  region_code: string;
  region_nom: string;
};

type BDNBStatsParDepartement = BDNBStatsByArea & {
  departement_code: string;
  departement_nom: string;
  region_code: string;
  region_nom: string;
};

type BDNBStatsByArea = {
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

type DataBin = {
  minValue: number;
  maxValue: number;
  color: string;
};

/**
 * Calcule des intervalles (bins) et affecte des couleurs en vue d'être affichés sur la carte.
 * Permet de s'assurer que la coloration ne sera pas monotone.
 */
export function calculateBins(
  data: number[],
  numberOfBins: number,
  minColor: string,
  maxColor: string
): DataBin[] {
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

function getAreaToMapConfig(area: Area, stats: BDNBStats | null) {
  if (!stats) {
    return {} as const;
  }
  switch (area) {
    case 'national':
    case 'regional':
      return {
        areaMode: 'regional',
        areaIdPropertyName: 'region_code',
        mapSourceData: stats.regional,
      } as const;
    case 'departemental':
      return {
        areaMode: 'departemental',
        areaIdPropertyName: 'departement_code',
        mapSourceData: stats.departemental,
      } as const;
  }
}
