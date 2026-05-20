import { useMemo } from 'react';

import CardSearchDetails from '@/components/Map/components/CardSearchDetails';
import Accordion from '@/components/ui/Accordion';
import type { Point } from '@/types/Point';
import type { StoredAddress } from '@/types/StoredAddress';

type EligibilityResultsPanelProps = {
  addresses: StoredAddress[];
  visible: boolean;
  setVisible: (visible: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onJumpTo: (args: { coordinates: Point; zoom?: number }) => void;
  onRemove: (entry: StoredAddress) => void;
  onContacted: (entry: StoredAddress) => void;
  onReset: () => void;
};

/**
 * Listing of tested addresses + their eligibility status. Reuses the V1
 * `<CardSearchDetails>` card (contact form modal, distance, badge…) so the
 * user experience matches the legacy `/carte` panel.
 *
 * Visual wrapper (white card / shadow / rounded) is owned by the parent so
 * the search input and results share a single card — V1 parity.
 */
export function EligibilityResultsPanel({
  addresses,
  visible,
  setVisible,
  selectedIndex,
  setSelectedIndex,
  onJumpTo,
  onRemove,
  onContacted,
  onReset,
}: EligibilityResultsPanelProps) {
  // Stable per-row `setExpanded` references so `<CardSearchDetails>`'s memo
  // doesn't refire on every parent render (V1 parity).
  const setExpandedFunctions = useMemo(
    () =>
      addresses.map((_, index) => (expanded: boolean) => {
        setSelectedIndex(expanded ? index : -1);
      }),
    [addresses.length, setSelectedIndex]
  );

  if (addresses.length === 0) return null;

  return (
    <Accordion
      small
      simple
      label={
        <>
          {addresses.length} adresse{addresses.length > 1 ? 's' : ''} recherchée{addresses.length > 1 ? 's' : ''}
        </>
      }
      expanded={visible}
      onExpandedChange={setVisible}
      onClose={onReset}
    >
      <div className="flex flex-col gap-2 max-h-[50dvh] overflow-auto">
        {addresses.map((address, index) => (
          <CardSearchDetails
            key={address.id}
            address={address}
            onClick={(addr) => onJumpTo({ coordinates: addr.coordinates })}
            onClickClose={(result) => result.coordinates && onRemove(address)}
            onContacted={() => onContacted(address)}
            expanded={selectedIndex === index}
            setExpanded={setExpandedFunctions[index]}
          />
        ))}
      </div>
    </Accordion>
  );
}
