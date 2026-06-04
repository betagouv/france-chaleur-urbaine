import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { type ReactNode, useState } from 'react';

import IframeCodeBlock from '@/components/IFrame/IframeCodeBlock';
import Notice from '@/components/ui/Notice';
import { AddressField } from '@/modules/form/AddressField';
import type { Coords } from '@/modules/geo/types';
import { buildIframeCode, defaultIframeConfig, type IframeConfig } from '@/modules/map/client/admin/iframeGenerator';
import { type LayerKey, layerKeys } from '@/modules/map/client/iframeCarteParams';

const layerLabels: Record<LayerKey, string> = {
  'perimetres-de-developpement-prioritaire': 'Périmètres de développement prioritaire',
  'reseaux-de-chaleur': 'Réseaux de chaleur',
  'reseaux-de-froid': 'Réseaux de froid',
  'reseaux-en-construction': 'Réseaux en construction',
};

const IFrameMapIntegrationForm = ({ label }: { label?: ReactNode }) => {
  const [layers, setLayers] = useState<LayerKey[]>([...defaultIframeConfig.layers]);
  const [coords, setCoords] = useState<Coords | null>(null);

  const toggleLayer = (key: LayerKey, enable: boolean) => {
    setLayers((current) => (enable ? [...current, key] : current.filter((layer) => layer !== key)));
  };

  // Public self-service embed: open legend (legacy parity), no tracking source. Annotated so
  // `center` keeps its tuple type through the spread.
  const config: IframeConfig = {
    ...defaultIframeConfig,
    layers,
    legend: 'auto',
    ...(coords ? { center: [coords.lon, coords.lat], zoom: 12 } : {}),
  };

  return (
    <>
      <Checkbox
        legend=""
        options={layerKeys.map((key) => ({
          label: layerLabels[key],
          nativeInputProps: {
            checked: layers.includes(key),
            onChange: (event) => toggleLayer(key, event.target.checked),
          },
        }))}
      />
      {label ?? (
        <Notice variant="info" size="xs">
          Vous souhaitez centrer la carte sur un endroit en particulier ?
        </Notice>
      )}
      <div className="mt-4 max-w-[500px]">
        <AddressField
          nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
          onSelect={(item) => setCoords({ lat: item.geometry.coordinates[1], lon: item.geometry.coordinates[0] })}
          onClear={() => setCoords(null)}
        />
      </div>
      <IframeCodeBlock className="fr-mt-3w" code={buildIframeCode(config, null)} />
    </>
  );
};

export default IFrameMapIntegrationForm;
