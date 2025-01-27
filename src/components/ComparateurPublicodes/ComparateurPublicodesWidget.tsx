import { fr } from '@codegouvfr/react-dsfr';
import React from 'react';

import { FormProvider } from '@/components/form/publicodes/FormProvider';
import Heading from '@/components/ui/Heading';
import { Table, type ColumnDef } from '@/components/ui/Table';
import { type LocationInfoResponse } from '@/pages/api/location-infos';
import { postFetchJSON } from '@/utils/network';
import { ObjectEntries } from '@/utils/typescript';

import { addresseToPublicodesRules, modesDeChauffage } from './mappings';
import { type simulatorTabs } from './Placeholder';
import useSimulatorEngine from './useSimulatorEngine';

type ComparateurPublicodesWidgetProps = React.HTMLAttributes<HTMLDivElement> & {
  coords?: [longitude?: number, latitude?: number];
  city?: string;
  cityCode?: string;
  address?: string;
};

export type TabId = (typeof simulatorTabs)[number]['tabId'];
const ComparateurPublicodesWidget: React.FC<ComparateurPublicodesWidgetProps> = ({
  children,
  coords,
  city,
  cityCode,
  address,
  ...props
}) => {
  const engine = useSimulatorEngine();

  React.useEffect(() => {
    if (!coords || !city || !cityCode) {
      return;
    }
    const loadInfos = async () => {
      const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
        lon: coords[0],
        lat: coords[1],
        city,
        cityCode,
      });

      engine.setSituation(
        ObjectEntries(addresseToPublicodesRules).reduce(
          (acc, [key, infoGetter]) => ({
            ...acc,
            [key]: infoGetter(infos) ?? null,
          }),
          {}
        )
      );
    };
    loadInfos();
  }, [coords, city, cityCode]);

  const modesDeChauffageToDisplay = modesDeChauffage
    .filter(({ type, label }) => (type as any).includes('collectif') && !label.includes('PAC'))
    .map((typeInstallation) => ({
      id: typeInstallation.label,
      label: typeInstallation.label,
      bilan: engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . total avec aides`),
      emissionsCO2: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Total`),
    }))
    .sort((a, b) => a.bilan - b.bilan);

  const columns: ColumnDef<{ label: string; bilan: number }>[] = [
    {
      headerName: 'Mode de chauffage',
      field: 'label',
      flex: 3,
    },
    {
      headerName: 'Coût annuel chauffage',
      flex: 2,
      field: 'bilan',
      renderCell: ({ value }) => value.toLocaleString('fr-FR', { currency: 'EUR', maximumFractionDigits: 0, style: 'currency' }),
    },
    {
      headerName: 'Émissions CO2',
      flex: 2,
      field: 'emissionsCO2',
      renderCell: ({ value }) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kgCO2e`,
    },
  ];

  return (
    <div {...props}>
      <FormProvider engine={engine}>
        <Heading as="h2" size="h4">
          Comparaison des modes de chauffage
        </Heading>
        <Table
          style={{ width: '100%' }}
          getRowClassName={({ id }) => (id === 'Réseau de chaleur' ? fr.cx('fr-text--bold') : '')}
          columns={columns}
          hideFooter
          rows={modesDeChauffageToDisplay}
          autosizeOnMount
          disableRowSelectionOnClick
          autoHeight
          pageSize={20}
        />
        <div className={fr.cx('fr-text--sm', 'fr-mt-2w')} style={{ textAlign: 'right', fontStyle: 'italic' }}>
          Accéder au{' '}
          <a
            href={`/outils/comparateur-performances?address=${encodeURIComponent(
              address as string
            )}&modes-de-chauffage=${encodeURIComponent(
              modesDeChauffageToDisplay.map(({ label }) => label).join(',')
            )}&tabId=modes-de-chauffage`}
            target="_blank"
            rel="noopener noreferrer"
          >
            comparateur complet
          </a>
        </div>
      </FormProvider>
    </div>
  );
};

export default ComparateurPublicodesWidget;
