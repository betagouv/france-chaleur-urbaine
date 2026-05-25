import type {
  DataDrivenPropertyValueSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
  LayerSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl';
import { type ComponentProps, isValidElement, type PropsWithChildren } from 'react';

import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import Tooltip from '@/components/ui/Tooltip';
import type { useAuthentication } from '@/modules/auth/client/hooks';
import type { TileSourceId } from '@/modules/tiles/server/tiles.config';
import { isDefined } from '@/utils/core';
import { prettyFormatNumber } from '@/utils/strings';

import type { MapConfiguration } from '../config/map-configuration';

export type InternalSourceId =
  | 'distance-measurements-lines'
  | 'distance-measurements-labels'
  | 'linear-heat-density-lines'
  | 'linear-heat-density-labels'
  | 'buildings-data-extraction-polygons'
  | 'adressesEligibles'
  | 'customGeojson'
  | 'geomUpdate';

export type SourceId = TileSourceId | InternalSourceId;

export type LayerSymbolSpecification = {
  key: string;
  url: string;
  sdf?: boolean;
};

export type VectorSourceOptions = Omit<VectorSourceSpecification, 'tiles' | 'type'>;

export type MapLayerSpecification<ILayerId = string> = Omit<LayerSpecification, 'source' | 'source-layer' | 'filter'> & {
  id: ILayerId;
  'source-layer'?: string;
  layout?: LayerSpecification['layout'];
  isVisible: (config: MapConfiguration) => boolean;
  filter?: (config: MapConfiguration) => FilterSpecification;
} & (
    | {
        unselectable: true;
        popup?: never;
        popupOffset?: never;
      }
    | {
        unselectable?: false;
        popup: PopupHandler;
        popupOffset?: [number, number];
      }
  );

export type MapSourceLayersSpecification = {
  sourceId: SourceId;
  layers: MapLayerSpecification[];
} & ({ source?: VectorSourceOptions } | { source: GeoJSONSourceSpecification });

export type ColorThreshold = {
  value: number;
  color: `#${string}`;
};

export type LegendInterval = {
  min: string;
  max: string;
  color: `#${string}`;
};

export const ifHoverElse = <T extends string | number>(valueIfHover: T, valueElse: T) =>
  ['case', ['boolean', ['feature-state', 'hover'], false], valueIfHover, valueElse] satisfies DataDrivenPropertyValueSpecification<T>;

type PopupTitleProps = {
  close: () => void;
  subtitle?: string | React.ReactNode;
  title?: string;
};

const PopupTitle = ({ subtitle, close, children, title }: PropsWithChildren<PopupTitleProps>) => (
  <div className="flex justify-between">
    <div className="self-center mr-1">
      <Heading as="h6" mb="0" title={title}>
        {children}
      </Heading>
      {subtitle && <div className="italic text-xs">{subtitle}</div>}
    </div>
    <Button priority="tertiary no outline" iconId="fr-icon-close-line" title="Fermer l'infobulle" onClick={close} />
  </div>
);

type PopupPropertyProps<T> = {
  label: React.ReactNode;
  value: T | undefined | null;
  unit?: string;
  formatter?: (value: T) => React.ReactNode;
  tooltip?: React.ReactNode;
} & (T extends number ? { raw?: boolean } : object);

function PopupProperty<T>({ label, value, unit, formatter, tooltip, ...props }: PopupPropertyProps<T>) {
  return (
    <>
      <div className="flex items-center gap-1">
        {label}
        {isDefined(tooltip) && <Tooltip title={tooltip} />}
      </div>
      <div className="font-bold">
        {isDefined(value)
          ? isDefined(formatter)
            ? formatter(value)
            : isValidElement(value)
              ? value
              : `${typeof value === 'number' ? ('raw' in props ? value : prettyFormatNumber(value)) : value} ${unit ?? ''}`
          : 'Non connu'}
      </div>
    </>
  );
}

function TwoColumns({ children }: PropsWithChildren) {
  return <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">{children}</div>;
}

export const buildPopupStyleHelpers = (close: () => void) => ({
  close,
  Property: PopupProperty,
  Title: buildPopupTitle(close),
  TwoColumns,
});
export const buildPopupTitle = (close: () => void) => {
  const CloseableTitle = (props: Omit<ComponentProps<typeof PopupTitle>, 'close'>) => <PopupTitle close={close} {...props} />;
  return CloseableTitle;
};

export type PopupStyleHelpers = ReturnType<typeof buildPopupStyleHelpers>;

export type PopupContext = {
  hasRole: ReturnType<typeof useAuthentication>['hasRole'];
  isAuthenticated: ReturnType<typeof useAuthentication>['isAuthenticated'];
  pathname: string;
};

export type PopupHandler<Data = any> = (data: Data, styleHelpers: PopupStyleHelpers, context: PopupContext) => React.ReactNode;

export const defineLayerPopup = <Data,>(popupFunc: PopupHandler<Data>) => popupFunc;
