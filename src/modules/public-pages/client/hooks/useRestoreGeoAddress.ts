import { useEffect, useRef } from 'react';

import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';

type UseRestoreGeoAddressParams = {
  /** Address label known from a previous visit or an URL parameter. */
  addressLabel: string | undefined;
  /** Current BAN feature of the form; nothing happens while one is selected. */
  geoAddress: BANAddressFeature | undefined;
  onRestore: (geoAddress: BANAddressFeature) => void;
};

/**
 * Rebuilds the BAN feature of an address only known by its label (page reload, partner
 * iframe hand-off): the text is prefilled in the input but the form needs the feature.
 * Runs once per label, so clearing the field afterwards does not restore it again.
 */
export function useRestoreGeoAddress({ addressLabel, geoAddress, onRestore }: UseRestoreGeoAddressParams) {
  const attemptedLabelRef = useRef<string>(undefined);

  // BAN lookup of the label, aborted if the component unmounts first
  useEffect(() => {
    if (!addressLabel || geoAddress || attemptedLabelRef.current === addressLabel) {
      return;
    }
    attemptedLabelRef.current = addressLabel;
    const controller = new AbortController();
    searchBANAddresses({ query: addressLabel, signal: controller.signal })
      .then((features) => {
        const match = features.find((feature) => feature.properties.label === addressLabel);
        if (match) {
          onRestore(match);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [addressLabel, geoAddress]);
}
