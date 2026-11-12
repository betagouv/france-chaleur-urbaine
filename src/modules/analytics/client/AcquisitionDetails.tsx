import { type Acquisition, getAcquisitionSource } from '../constants';

type AcquisitionDetailsProps = { acquisition?: Acquisition | null };

/**
 * Displays the campaign recorded with a demand, including explicit missing attribution.
 */
export function AcquisitionDetails({ acquisition }: AcquisitionDetailsProps) {
  if (!acquisition) {
    return null;
  }
  return (
    <div className="min-w-0 break-words text-sm leading-6">
      <div>Source : {getAcquisitionSource(acquisition) || 'Non renseignée'}</div>
      <div>Campagne : {acquisition.campaign || 'Non renseignée'}</div>
    </div>
  );
}
