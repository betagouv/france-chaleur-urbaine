import {
  Button,
  ButtonGroup,
  ModalClose,
  ModalContent,
} from '@dataesr/react-dsfr';
import CarteFrance, { DonneeParDepartement, Mode } from './CarteFrance';
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
          <ModalContentWrapper>
            <ButtonGroup size="sm" isInlineFrom="xs">
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
            <LayoutTwoColumns>
              <FirstColumn>
                <BigBlueText>
                  {(modeCarte === 'departemental'
                    ? departements.find(
                        (d) => d.code === selectedData?.departement
                      )?.nom
                    : modeCarte === 'regional'
                    ? regions.find((d) => d.code === selectedData?.departement) // FIXME récupérer les données par région également
                        ?.nom
                    : 'France') ?? '--'}
                </BigBlueText>
                <BlackNumbersLine>
                  <div>
                    <BlackNumber>
                      {selectedData?.nb_reseaux ?? '--'}
                    </BlackNumber>
                    <BlackText>réseaux de chaleur</BlackText>
                  </div>
                  <div>
                    <BlackNumber>
                      {selectedData?.taux_enrr
                        ? `${selectedData?.taux_enrr}%`
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
                  {selectedData?.[distanceReseau]?.[
                    `nb_${modeBatimentLogement}`
                  ] ?? '--'}
                </BigBlueNumber>
                <BlueText>
                  {modeBatimentLogement} raccordables identifiés
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
                  {selectedData?.[distanceReseau]?.[modeBatimentLogement]
                    ?.collectif_gaz ?? '--'}
                </BlueNumber>
                <BlueText>
                  {modeBatimentLogement} chauffés au gaz collectif
                </BlueText>
                <BlueNumber className="fr-mt-1w">
                  {selectedData?.[distanceReseau]?.[modeBatimentLogement]
                    ?.collectif_fioul ?? '--'}
                </BlueNumber>
                <BlueText>
                  {modeBatimentLogement} chauffés au fioul collectif
                </BlueText>
                <GreyText className="fr-mt-2w">et&nbsp;:</GreyText>
                <GreyNumber>
                  {selectedData?.[distanceReseau]?.[modeBatimentLogement]
                    ?.individuel_gaz ?? '--'}
                </GreyNumber>
                <GreyText>
                  {modeBatimentLogement} chauffés au gaz individuel
                </GreyText>
              </FirstColumn>
              <SecondColumn>
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
                <LegendSourceLine>
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

type BDNBStatsParDepartement = {
  departement: string;
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
  const sortedData = [...data].filter((v) => !!v).sort((a, b) => a - b);
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
