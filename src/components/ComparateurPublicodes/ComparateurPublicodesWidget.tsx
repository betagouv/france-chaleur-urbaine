import { fr } from '@codegouvfr/react-dsfr';
import React from 'react';

import { FormProvider } from '@/components/form/publicodes/FormProvider';
import Heading from '@/components/ui/Heading';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { postFetchJSON } from '@/utils/network';
import { ObjectEntries } from '@/utils/typescript';

import { addresseToPublicodesRules, modesDeChauffage } from './mappings';
import type { simulatorTabs } from './Placeholder';
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
        city,
        cityCode,
        lat: coords[1],
        lon: coords[0],
      });

      engine.setSituation(
        ObjectEntries(addresseToPublicodesRules).reduce(
          (acc, [key, infoGetter]) => {
            acc[key] = infoGetter(infos) ?? null;
            return acc;
          },
          {} as Record<string, any>
        )
      );
    };
    void loadInfos();
  }, [coords, city, cityCode]);

  const modesDeChauffageToDisplay = modesDeChauffage
    .filter(({ type, label }) => (type as any).includes('collectif') && !label.includes('PAC'))
    .map((typeInstallation) => ({
      bilan: engine.getFieldAsNumber(`Bilan x ${typeInstallation.coutPublicodeKey} . total avec aides`),
      emissionsCO2: engine.getFieldAsNumber(`env . Installation x ${typeInstallation.emissionsCO2PublicodesKey} . Total`),
      id: typeInstallation.label,
      label: typeInstallation.label,
    }))
    .sort((a, b) => a.bilan - b.bilan);

  const columns: ColumnDef<{ label: string; bilan: number }>[] = [
    {
      accessorKey: 'label',
      flex: 3,
      header: 'Mode de chauffage',
    },
    {
      accessorKey: 'bilan',
      cellProps: {
        maximumFractionDigits: 0,
      },
      cellType: 'Price',
      flex: 2,
      header: 'Coût annuel chauffage',
    },
    {
      accessorKey: 'emissionsCO2',
      cellProps: {
        maximumFractionDigits: 0,
      },
      cellType: 'Number',
      flex: 2,
      header: 'Émissions CO2 (kgCO2e)',
    },
  ];

  return (
    <div {...props}>
      <FormProvider engine={engine}>
        <Heading as="h2" size="h4">
          Comparaison des modes de chauffage
        </Heading>
        <TableSimple columns={columns} data={modesDeChauffageToDisplay} />
        <div className={fr.cx('fr-text--sm', 'fr-mt-2w')} style={{ fontStyle: 'italic', textAlign: 'right' }}>
          Accéder au{' '}
          <a
            href={`/comparateur-couts-performances?address=${encodeURIComponent(address as string)}&modes-de-chauffage=${encodeURIComponent(
              modesDeChauffageToDisplay.map(({ label }) => label).join(',')
            )}&tabId=modes-de-chauffage`}
            target="_blank"
            rel="noopener noreferrer"
          >
            mode avancé
          </a>
        </div>
      </FormProvider>
    </div>
  );
};

export default ComparateurPublicodesWidget;
