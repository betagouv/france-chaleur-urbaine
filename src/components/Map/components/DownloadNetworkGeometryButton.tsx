import AsyncButton from '@/components/ui/AsyncButton';
import { toastErrors } from '@/modules/notification';
import type { NetworkTable } from '@/modules/reseaux/server/geometry-operations';
import trpc from '@/modules/trpc/client';
import { downloadObject } from '@/utils/browser';
import { normalize } from '@/utils/strings';

type DownloadNetworkGeometryButtonProps = {
  /**
   * L'ID FCU du réseau.
   */
  id_fcu: number;
  /**
   * Le type de réseau.
   */
  type: NetworkTable;
  /**
   * Le nom du réseau. (utilisé pour le nom du fichier)
   */
  networkName: string;
};

/**
 * Bouton qui permet de télécharger la géométrie d'un réseau au format GeoJSON.
 */
export function DownloadNetworkGeometryButton({ id_fcu, type, networkName }: DownloadNetworkGeometryButtonProps) {
  const utils = trpc.useUtils();

  const handleDownload = toastErrors(async () => {
    const geometry = await utils.reseaux.getNetworkGeometry.fetch({ id: id_fcu, type });

    if (!geometry) {
      throw new Error('Aucune géométrie disponible pour ce réseau');
    }

    const geojson: GeoJSON.FeatureCollection = {
      features: [
        {
          geometry,
          properties: {
            id_fcu,
            name: networkName,
          },
          type: 'Feature',
        },
      ],
      type: 'FeatureCollection',
    };

    downloadObject(geojson, `${normalize(networkName)}.geojson`, 'application/geo+json');
  });

  return (
    <AsyncButton priority="secondary" iconId="fr-icon-download-line" onClick={handleDownload}>
      Télécharger le tracé (GeoJSON)
    </AsyncButton>
  );
}
