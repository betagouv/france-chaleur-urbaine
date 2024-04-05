import { PopupTitle, PopupType } from '../Map.style';
import { isDefined } from '@utils/core';
import { ZonePotentielChaud } from 'src/types/layers/ZonePotentielChaud';
import { prettyFormatNumber } from '@utils/strings';
import { ReactElement } from 'react';
import {
  Datacenter,
  Industrie,
  InstallationElectrogene,
  SolaireThermiqueFriche,
  SolaireThermiqueParking,
  StationDEpuration,
  UniteDIncineration,
} from 'src/types/layers/enrr_mobilisables';
import Text from '@components/ui/Text';
import { LayerId } from '../map-layers';

export const layersWithDynamicContentPopup = [
  'zonesPotentielChaud',
  'zonesPotentielFortChaud',
  'enrrMobilisables-datacenter',
  'enrrMobilisables-industrie',
  'enrrMobilisables-installations-electrogenes',
  'enrrMobilisables-stations-d-epuration',
  'enrrMobilisables-unites-d-incineration',
  'enrrMobilisables-friches',
  'enrrMobilisables-parkings',
] as const satisfies ReadonlyArray<LayerId>;

export function isDynamicPopupContent(
  content: any
): content is DynamicPopupContentType {
  return layersWithDynamicContentPopup.includes(content.type);
}

// use union types to get good typing
// be careful to use the LayerId in the 'type' property
export type DynamicPopupContentType =
  | ZonePotentielChaudPopupContentType
  | ENRRMobilisablePopupContentType;

type ZonePotentielChaudPopupContentType = {
  type: 'zonesPotentielChaud' | 'zonesPotentielFortChaud';
  properties: ZonePotentielChaud;
};

type ENRRMobilisablePopupContentType =
  | ENRRMobilisableDatacenterPopupContentType
  | ENRRMobilisableIndustriePopupContentType
  | ENRRMobilisableInstallationsElectrogenesPopupContentType
  | ENRRMobilisableStationsDEpurationPopupContentType
  | ENRRMobilisableUniteDIncinerationPopupContentType
  | ENRRMobilisableFrichePopupContentType
  | ENRRMobilisableParkingPopupContentType;

type ENRRMobilisableDatacenterPopupContentType = {
  type: 'enrrMobilisables-datacenter';
  properties: Datacenter;
};
type ENRRMobilisableIndustriePopupContentType = {
  type: 'enrrMobilisables-industrie';
  properties: Industrie;
};
type ENRRMobilisableInstallationsElectrogenesPopupContentType = {
  type: 'enrrMobilisables-installations-electrogenes';
  properties: InstallationElectrogene;
};
type ENRRMobilisableStationsDEpurationPopupContentType = {
  type: 'enrrMobilisables-stations-d-epuration';
  properties: StationDEpuration;
};
type ENRRMobilisableUniteDIncinerationPopupContentType = {
  type: 'enrrMobilisables-unites-d-incineration';
  properties: UniteDIncineration;
};
type ENRRMobilisableFrichePopupContentType = {
  type: 'enrrMobilisables-friches';
  properties: SolaireThermiqueFriche;
};
type ENRRMobilisableParkingPopupContentType = {
  type: 'enrrMobilisables-parkings';
  properties: SolaireThermiqueParking;
};

/**
 * Return the corresponding popup content depending on the content type
 */
const DynamicPopupContent = ({
  content,
}: {
  content: DynamicPopupContentType;
}) => {
  switch (content.type) {
    case 'zonesPotentielChaud':
      return (
        <ZonePotentielChaudPopupContent
          zonePotentielChaud={content.properties}
        />
      );
    case 'zonesPotentielFortChaud':
      return (
        <ZonePotentielChaudPopupContent
          zonePotentielChaud={content.properties}
          fortChaud
        />
      );
    case 'enrrMobilisables-datacenter':
      return (
        <ENRRMobilisableDatacenterPopupContent
          datacenter={content.properties}
        />
      );
    case 'enrrMobilisables-industrie':
      return (
        <ENRRMobilisableIndustriePopupContent industrie={content.properties} />
      );
    case 'enrrMobilisables-installations-electrogenes':
      return (
        <ENRRMobilisableInstallationElectrogenePopupContent
          installationElectrogene={content.properties}
        />
      );
    case 'enrrMobilisables-stations-d-epuration':
      return (
        <ENRRMobilisableStationsDEpurationPopupContent
          stationDEpuration={content.properties}
        />
      );
    case 'enrrMobilisables-unites-d-incineration':
      return (
        <ENRRMobilisableUniteDIncinerationPopupContent
          uniteDIncineration={content.properties}
        />
      );
    case 'enrrMobilisables-friches':
      return (
        <ENRRMobilisableSolaireThermiqueFrichePopupContent
          friche={content.properties}
        />
      );
    case 'enrrMobilisables-parkings':
      return (
        <ENRRMobilisableSolaireThermiqueParkingPopupContent
          parking={content.properties}
        />
      );
    default:
      throw new Error('not implemented');
  }
};

export default DynamicPopupContent;

/**
 * Contenu de la popup pour les zones à potentiel chaud et fort chaud.
 */
const ZonePotentielChaudPopupContent = ({
  zonePotentielChaud,
  fortChaud,
}: {
  zonePotentielChaud: ZonePotentielChaud;
  fortChaud?: boolean;
}) => {
  return (
    <section>
      {zonePotentielChaud.ID_ZONE && (
        <PopupTitle className="fr-mr-3w">
          Zone à {fortChaud ? ' fort' : ''} potentiel
        </PopupTitle>
      )}
      <strong>Nombre de bâtiments “intéressants”&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.NBRE_BAT)
        ? zonePotentielChaud.NBRE_BAT
        : 'Non connu'}
      <br />
      <strong>Besoins en chauffage&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.CHAUF_MWH) ? (
        <>{formatMWh(zonePotentielChaud.CHAUF_MWH)}</>
      ) : (
        'Non connu'
      )}
      <br />
      <strong>Besoins en eau chaude sanitaire&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.ECS_MWH) ? (
        <>{formatMWh(zonePotentielChaud.ECS_MWH)}</>
      ) : (
        'Non connu'
      )}
      <br />
      <strong>Part du secteur tertiaire&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.PART_TER) ? (
        <>{prettyFormatNumber(zonePotentielChaud.PART_TER * 100, 2)}&nbsp;%</>
      ) : (
        'Non connu'
      )}
    </section>
  );
};

function formatMWh(value: number): ReactElement {
  let unit: string;

  if (value >= 1e6) {
    value /= 1e6;
    unit = 'TWh/an';
  } else if (value >= 1e3) {
    value /= 1e3;
    unit = 'GWh/an';
  } else {
    unit = 'MWh/an';
  }

  return (
    <>
      {value.toPrecision(3)}&nbsp;{unit}
    </>
  );
}

/**
 * Intervals:
 * - < 25 GWh
 * - [100;250 GWh[
 * - >= 2000 GWh
 */
function formatConsommation(value: string): string {
  switch (value[0]) {
    case '<': {
      const match = /< (\d+) GWh/.exec(value);
      return match ? `inférieure à ${match[1]} GWh/an` : value;
    }
    case '>': {
      const match = />= (\d+) GWh/.exec(value);
      return match ? `supérieure à ${match[1]} GWh/an` : value;
    }
    case '[': {
      const match = /\[(\d+);(\d+) GWh\[/.exec(value);
      return match ? `entre ${match[1]} et ${match[2]} GWh/an` : value;
    }
    default:
      // unknown
      return value;
  }
}

const ENRRMobilisableDatacenterPopupContent = ({
  datacenter,
}: {
  datacenter: Datacenter;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Datacenter</PopupType>
      <PopupTitle className="fr-mr-3w">{datacenter.nom}</PopupTitle>
      <PopupProperty label="Catégorie" value={datacenter.categorie} />
      <PopupProperty label="Commune" value={datacenter.com_nom} />
      <PopupProperty label="Identifiant national" value={datacenter.id} />
      <QualiteLabel value={datacenter.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableIndustriePopupContent = ({
  industrie,
}: {
  industrie: Industrie;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Industrie</PopupType>
      <PopupTitle className="fr-mr-3w">{industrie.nom_site}</PopupTitle>
      <PopupProperty label="Activité" value={industrie.activite} />
      <PopupProperty label="Exploitant" value={industrie.exploitant} />
      <PopupProperty
        label="Consommation"
        value={industrie.conso}
        formatter={formatConsommation}
      />
      <PopupProperty
        label="Température des effluents majoritaires"
        value={industrie.t_major}
      />
      <PopupProperty
        label="Température des effluents minoritaires"
        value={industrie.t_minor}
      />
      <PopupProperty label="Commune" value={industrie.com_nom} />
      <QualiteLabel value={industrie.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableInstallationElectrogenePopupContent = ({
  installationElectrogene,
}: {
  installationElectrogene: InstallationElectrogene;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Installation électrogène</PopupType>
      <PopupTitle className="fr-mr-3w">
        {installationElectrogene.nom_inst}
      </PopupTitle>
      <PopupProperty label="Type" value={installationElectrogene.type_inst} />
      <PopupProperty label="Commune" value={installationElectrogene.com_nom} />
      <QualiteLabel value={installationElectrogene.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableStationsDEpurationPopupContent = ({
  stationDEpuration,
}: {
  stationDEpuration: StationDEpuration;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Station d'épuration</PopupType>
      <PopupTitle className="fr-mr-3w">{stationDEpuration.step_nom}</PopupTitle>
      <PopupProperty
        label="Débit entrant"
        value={stationDEpuration.debit_m3j}
        unit="m³/j"
      />
      <PopupProperty
        label="Capacité"
        value={stationDEpuration.capa_eh}
        unit="équivalent-habitants"
      />
      <PopupProperty label="Exploitant" value={stationDEpuration.exploitant} />
      <PopupProperty label="Commune" value={stationDEpuration.com_nom} />
    </section>
  );
};

const ENRRMobilisableUniteDIncinerationPopupContent = ({
  uniteDIncineration,
}: {
  uniteDIncineration: UniteDIncineration;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Unité d'incinération</PopupType>
      <PopupTitle className="fr-mr-3w">
        {uniteDIncineration.nom_inst}
      </PopupTitle>
      <PopupProperty label="Type" value={uniteDIncineration.type_inst} />
      {/* Désactivé car non fiable dans les données pour le moment */}
      {/* <PopupProperty label="Commune" value={uniteDIncineration.com_nom} /> */}
      <QualiteLabel value={uniteDIncineration.qualite_xy} />
    </section>
  );
};

interface PopupPropertyProps<T> {
  label: string;
  value: T;
  unit?: string; // overridden by the formatter if present
  formatter?: (value: T) => string | ReactElement;
}
const PopupProperty = <T,>({
  label,
  value,
  unit,
  formatter,
}: PopupPropertyProps<T>) => (
  <>
    <strong>{label}&nbsp;:</strong>&nbsp;
    {isDefined(value)
      ? isDefined(formatter)
        ? formatter(value)
        : `${typeof value === 'number' ? prettyFormatNumber(value) : value} ${
            unit ?? ''
          }`
      : 'Non connu'}
    <br />
  </>
);

const qualiteToLabel = {
  1: '', // exact
  2: 'Localisation à la parcelle',
  3: 'Localisation au quartier',
  4: "Localisation à l'IRIS",
  5: 'Localisation à la commune',
} as const;

const QualiteLabel = ({ value }: { value: string | number }) => (
  <Text fontStyle="italic">
    {qualiteToLabel[`${value}`[0] as unknown as keyof typeof qualiteToLabel] ??
      ''}
  </Text>
);

const ENRRMobilisableSolaireThermiqueFrichePopupContent = ({
  friche,
}: {
  friche: SolaireThermiqueFriche;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Friche</PopupType>
      <PopupTitle className="fr-mr-3w">{friche.site_nom}</PopupTitle>
      <PopupProperty label="Surface" value={friche.surf_site} unit="m²" />
    </section>
  );
};

const ENRRMobilisableSolaireThermiqueParkingPopupContent = ({
  parking,
}: {
  parking: SolaireThermiqueParking;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Parking</PopupType>
      <PopupProperty label="Surface" value={parking.surfm2} unit="m²" />
    </section>
  );
};
