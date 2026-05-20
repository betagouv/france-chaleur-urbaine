import Badge from '@codegouvfr/react-dsfr/Badge';

import { getReadableDistance } from '@/modules/geo/client/helpers';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

import { buildPopupTitle } from '../core/common';

/** Nearest reverse-geocoded address with its distance (meters) from the tested point. */
export type NearestAddress = {
  label: string;
  distance: number;
};

/** Whether a heat network is close to the address/point (drives the badge and marker color). */
export const isEligibilityClose = (eligibility: HeatNetworksResponse) =>
  eligibility.basedOnCity ? eligibility.cityHasNetwork || eligibility.cityHasFuturNetwork : eligibility.isEligible;

type EligibilityPopupProps = {
  /** Title shown at the top of the popup (address label or formatted coordinates). */
  label: string;
  eligibility: HeatNetworksResponse;
  /** Optional nearest address, shown for information (only when relevant — e.g. close enough). */
  nearestAddress?: NearestAddress | null;
  close: () => void;
};

/**
 * Eligibility result popup: proximity badge, descriptive sentence, distance and
 * PDP mention. Shared by the address-search marker and the right-click
 * "tester l'éligibilité à ce point" context menu.
 */
export function EligibilityPopup({ label, eligibility, nearestAddress, close }: EligibilityPopupProps) {
  const { isEligible, distance, basedOnCity, cityHasNetwork, cityHasFuturNetwork, futurNetwork, inPDP, hasNoTraceNetwork } = eligibility;
  const isClose = isEligibilityClose(eligibility);
  const readableDistance = getReadableDistance(distance);
  const Title = buildPopupTitle(close);

  return (
    <div className="flex flex-col gap-2 text-sm leading-5">
      <Title
        subtitle={
          <>
            {nearestAddress && (
              <div className="text-sm">
                {nearestAddress.label} (à&nbsp;{Math.round(nearestAddress.distance)}&nbsp;m)
              </div>
            )}
            {isClose ? (
              <Badge small severity="success" className="mt-1">
                Réseau proche
              </Badge>
            ) : (
              <Badge small severity="error" className="mt-1">
                Pas de réseau connu
              </Badge>
            )}
          </>
        }
      >
        {label}
      </Title>
      <p className="mb-0">
        {basedOnCity
          ? cityHasNetwork
            ? 'Un réseau de chaleur passe dans cette ville.'
            : cityHasFuturNetwork
              ? 'Un réseau de chaleur passera bientôt dans cette ville.'
              : "Il n'y a pour le moment pas de réseau de chaleur dans cette ville."
          : (isEligible && distance === null) || (distance !== null && distance < 100)
            ? futurNetwork
              ? 'Un réseau de chaleur passera bientôt à proximité de cette adresse.'
              : 'Un réseau de chaleur passe à proximité de cette adresse.'
            : distance !== null && distance < 200
              ? "Le réseau n'est pas très loin."
              : hasNoTraceNetwork
                ? 'Réseau présent sur la commune, mais sans tracé connu.'
                : 'Pas de réseau de chaleur à proximité de cette adresse.'}
      </p>
      {readableDistance && !basedOnCity && (
        <div className="flex items-center gap-2 text-(--text-label-blue-france)">
          <img src="/icons/grid-line.svg" alt="" height={16} width={16} />
          <span>
            {futurNetwork ? 'passera à' : ''} {readableDistance}
          </span>
        </div>
      )}
      {inPDP && !basedOnCity && <p className="mb-0 text-xs">Adresse située dans un périmètre de développement prioritaire.</p>}
    </div>
  );
}
