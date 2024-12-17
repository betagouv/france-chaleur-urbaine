import { type DataDrivenPropertyValueSpecification, type SourceSpecification } from 'maplibre-gl';
import { type ComponentProps, type PropsWithChildren } from 'react';

import { type MapLayerSpecification } from '@/components/Map/map-layers';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import type { SourceId } from '@/server/services/tiles.config';
import { isDefined } from '@/utils/core';
import { prettyFormatNumber } from '@/utils/strings';

export type LayerSymbolSpecification = {
  key: string;
  url: string;
  sdf?: boolean; // Whether the image should be interpreted as an SDF image (= image we want to color)
};

export type MapSourceLayersSpecification = {
  sourceId: SourceId;
  source: SourceSpecification;
  layers: MapLayerSpecification[];
};

export type ColorThreshold = {
  value: number;
  color: `#${string}`;
};

export type LegendInterval = {
  min: string;
  max: string;
  color: `#${string}`;
};

export const intermediateTileLayersMinZoom = 12;
export const tileSourcesMaxZoom = 17;

/**
 * Helper pour faciliter la définition des styles des couches avec le survol.
 */
export const ifHoverElse = <T extends string | number>(valueIfHover: T, valueElse: T) =>
  ['case', ['boolean', ['feature-state', 'hover'], false], valueIfHover, valueElse] satisfies DataDrivenPropertyValueSpecification<T>;

type PopupTitleProps = {
  close: () => void;
  subtitle?: string | React.ReactNode;
};

const PopupTitle = ({ subtitle, close, children }: PropsWithChildren<PopupTitleProps>) => (
  <Box display="flex" justifyContent="space-between">
    <Box alignSelf="center" mr="1v">
      <Heading as="h6" mb="0">
        {children}
      </Heading>
      {subtitle && (
        <Box fontStyle="italic" fontSize="12px">
          {subtitle}
        </Box>
      )}
    </Box>
    <Button priority="tertiary no outline" iconId="fr-icon-close-line" title="Fermer l'infobulle" onClick={close} />
  </Box>
);

type PopupPropertyProps<T> = {
  label: string;
  value: T | undefined;
  unit?: string; // overridden by the formatter if present
  formatter?: (value: T) => React.ReactNode;
} & (T extends number ? { raw?: boolean } : {});

function PopupProperty<T>({ label, value, unit, formatter, ...props }: PopupPropertyProps<T>) {
  return (
    <>
      <Box>{label}</Box>
      <Box fontWeight="bold">
        {isDefined(value)
          ? isDefined(formatter)
            ? formatter(value)
            : `${typeof value === 'number' ? ('raw' in props ? value : prettyFormatNumber(value)) : value} ${unit ?? ''}`
          : 'Non connu'}
      </Box>
    </>
  );
}

function TwoColumns({ children }: PropsWithChildren) {
  return (
    <Box display="grid" gridTemplateColumns="auto auto" gap="4px" columnGap="16px">
      {children}
    </Box>
  );
}

/**
 * Fournit des composants utilisables par chaque popup pour l'aider à se construire.
 */
export const buildPopupStyleHelpers = (close: () => void) => ({
  Title: buildPopupTitle(close),
  Property: PopupProperty,
  TwoColumns: TwoColumns,
  close,
});
export const buildPopupTitle = (close: () => void) => {
  const CloseableTitle = (props: Omit<ComponentProps<typeof PopupTitle>, 'close'>) => <PopupTitle close={close} {...props} />;
  return CloseableTitle;
};

export type PopupStyleHelpers = ReturnType<typeof buildPopupStyleHelpers>;
