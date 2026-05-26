import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { clientConfig } from '@/client-config';
import Checkbox from '@/components/form/dsfr/Checkbox';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import ButtonCopy from '@/components/ui/ButtonCopy';
import Heading from '@/components/ui/Heading';
import Tag from '@/components/ui/Tag';
import { defaultMaxZoom, defaultMinZoom } from '@/modules/map/shared/config';
import { gestionnairesFilters } from '@/modules/reseaux/constants';

import { createMapConfiguration } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { FcuLogo } from '../controls/FcuLogo';
import type { MapCanvasController } from '../core/controller';
import { type LayerKey, layerKeys } from '../iframeCarteParams';
import { IframeLegend } from '../legend/IframeLegend';
import { Map } from '../Map';
import {
  buildIframeCode,
  buildIframeUrl,
  DEFAULT_IFRAME_HEIGHT,
  DEFAULT_IFRAME_WIDTH,
  defaultIframeConfig,
  type IframeConfig,
} from './iframeGenerator';

const layerLabels: Record<LayerKey, string> = {
  'reseaux-de-chaleur': 'Réseaux de chaleur',
  'reseaux-de-froid': 'Réseaux de froid',
  'reseaux-en-construction': 'Réseaux en construction',
  'zones-de-developpement-prioritaire': 'Périmètres de développement prioritaire',
};

// Known gestionnaires for the suggestion chips (free text stays allowed). `autre`
// is a filter pseudo-value, excluded; `mixéner` is used by existing iframes but
// isn't in the shared filter list.
const gestionnaireSuggestions = [
  ...gestionnairesFilters.filter((option) => option.value !== 'autre'),
  { label: 'Mixéner', value: 'mixéner' },
];

/**
 * Pushes the editable layer/filter state into the live map config (the `config`
 * prop is mount-only). Uses `updateProperty` to avoid clobbering the RDC limits
 * hydrated by `<MapStoreProvider>`.
 */
function ConfigSync({ layers, gestionnaire, reseaux }: Pick<IframeConfig, 'layers' | 'gestionnaire' | 'reseaux'>) {
  const { updateProperty } = useMapConfig();
  useEffect(() => {
    updateProperty('reseauxDeChaleur.show', layers.includes('reseaux-de-chaleur'));
    updateProperty('reseauxDeFroid', layers.includes('reseaux-de-froid'));
    updateProperty('reseauxEnConstruction', layers.includes('reseaux-en-construction'));
    updateProperty('zonesDeDeveloppementPrioritaire', layers.includes('zones-de-developpement-prioritaire'));
    updateProperty('filtreGestionnaire', gestionnaire);
    updateProperty('filtreIdentifiantReseau', reseaux);
  }, [updateProperty, layers, gestionnaire, reseaux]);
  return null;
}

/** Free-text token input + removable chips, with optional clickable suggestions. */
function TokenField({
  label,
  hintText,
  placeholder,
  values,
  onChange,
  suggestions,
}: {
  label: string;
  hintText?: ReactNode;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: { label: string; value: string }[];
}) {
  const [draft, setDraft] = useState('');
  const addValue = (rawValue: string) => {
    const trimmedValue = rawValue.trim();
    if (trimmedValue && !values.includes(trimmedValue)) {
      onChange([...values, trimmedValue]);
    }
    setDraft('');
  };
  return (
    <div>
      <Input
        label={label}
        hintText={hintText}
        nativeInputProps={{
          onChange: (event) => setDraft(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addValue(draft);
            }
          },
          placeholder,
          value: draft,
        }}
      />
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {suggestions.map((suggestion) => (
            <Button key={suggestion.value} type="button" size="small" priority="tertiary" onClick={() => addValue(suggestion.value)}>
              {suggestion.label}
            </Button>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map((value) => (
            <Tag key={value} dismissible nativeButtonProps={{ onClick: () => onChange(values.filter((item) => item !== value)) }}>
              {value}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

/** Reset cross rendered as an input `addon` (attached to the field), shown only when the value differs from its default. */
function clearAddon(canReset: boolean, onReset: () => void) {
  if (!canReset) {
    return undefined;
  }
  return (
    <Button type="button" priority="tertiary" iconId="fr-icon-close-line" title="Réinitialiser la valeur par défaut" onClick={onReset} />
  );
}

const IframeGeneratorPage = () => {
  const [config, setConfig] = useState<IframeConfig>(defaultIframeConfig);
  const mapRef = useRef<MapCanvasController | null>(null);

  const update = (patch: Partial<IframeConfig>) => setConfig((current) => ({ ...current, ...patch }));

  const toggleLayer = (key: LayerKey) =>
    setConfig((current) => ({
      ...current,
      layers: current.layers.includes(key) ? current.layers.filter((layer) => layer !== key) : [...current.layers, key],
    }));

  const captureView = () => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }
    const center = map.getCenter();
    update({ center: [round(center.lng), round(center.lat)], zoom: round(map.getZoom(), 2) });
  };

  const captureBounds = () => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }
    const bounds = map.getBounds();
    update({ maxBounds: [round(bounds.getWest()), round(bounds.getSouth()), round(bounds.getEast()), round(bounds.getNorth())] });
  };

  // Mount config for <Map> (config prop is mount-only); <ConfigSync> keeps it live afterwards.
  const initialMapConfig = useMemo(
    () =>
      createMapConfiguration({
        ...(config.gestionnaire.length > 0 ? { filtreGestionnaire: config.gestionnaire } : {}),
        ...(config.reseaux.length > 0 ? { filtreIdentifiantReseau: config.reseaux } : {}),
        reseauxDeChaleur: { show: config.layers.includes('reseaux-de-chaleur') },
        reseauxDeFroid: config.layers.includes('reseaux-de-froid'),
        reseauxEnConstruction: config.layers.includes('reseaux-en-construction'),
        zonesDeDeveloppementPrioritaire: config.layers.includes('zones-de-developpement-prioritaire'),
      }),
    [config.layers, config.gestionnaire, config.reseaux]
  );

  const iframeUrl = buildIframeUrl(config);
  const iframeCode = buildIframeCode(config);

  return (
    <SimplePage
      title="Générateur d'iframes carte"
      description="Génère l'URL et le code d'intégration d'une carte à embarquer"
      mode="authenticated"
    >
      <div className="fr-container fr-py-4w flex flex-col gap-8">
        <div>
          <Heading as="h1" color="blue-france">
            Générateur d'iframes carte
          </Heading>
          <p className="mb-0 text-sm text-(--text-mention-grey)">
            Configurez la carte, ajustez la vue dans l'aperçu, puis copiez le code à intégrer sur un site partenaire.
          </p>
        </div>

        <Section title="Données affichées">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <fieldset className="flex flex-col gap-1 border-0 p-0 m-0">
              <legend className="text-sm mb-1">Couches</legend>
              {layerKeys.map((key) => (
                <Checkbox
                  key={key}
                  label={layerLabels[key]}
                  nativeInputProps={{ checked: config.layers.includes(key), name: key, onChange: () => toggleLayer(key) }}
                />
              ))}
            </fieldset>

            <div className="flex flex-col gap-4">
              <TokenField
                label="Filtrer par gestionnaire"
                hintText="Texte libre — Entrée ou virgule pour ajouter. Suggestions ci-dessous."
                placeholder="Ex : dalkia"
                values={config.gestionnaire}
                onChange={(gestionnaire) => update({ gestionnaire: gestionnaire.map((value) => value.toLowerCase()) })}
                suggestions={gestionnaireSuggestions}
              />

              <TokenField
                label="Filtrer par identifiants SNCU"
                hintText="Isole ces réseaux. Limité aux identifiants SNCU (chaleur/froid) pour le moment."
                placeholder="Ex : 7412C"
                values={config.reseaux}
                onChange={(reseaux) => update({ reseaux })}
              />
            </div>
          </div>
        </Section>

        <Section title="Affichage de la carte">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Select
              label="Légende"
              nativeSelectProps={{
                onChange: (event) => update({ legend: event.target.value as IframeConfig['legend'] }),
                value: config.legend,
              }}
              options={[
                { label: 'Masquée', value: 'off' },
                { label: 'Repliée (bouton)', value: 'hidden' },
                { label: 'Ouverte', value: 'auto' },
              ]}
            />
            <Select
              label="Mode de la carte"
              nativeSelectProps={{
                onChange: (event) => update({ mode: event.target.value as IframeConfig['mode'] }),
                value: config.mode,
              }}
              options={[
                { label: 'Aucun', value: 'none' },
                { label: 'Recherche commune / réseau', value: 'network' },
                { label: "Éligibilité (test d'adresse)", value: 'eligibility' },
              ]}
            />
            <div className="flex gap-4">
              <Input
                label="Zoom min"
                className="mb-0 flex-1"
                addon={clearAddon(config.minZoom !== undefined, () => update({ minZoom: undefined }))}
                nativeInputProps={{
                  onChange: (event) => update({ minZoom: event.target.value === '' ? undefined : Number(event.target.value) }),
                  placeholder: String(defaultMinZoom),
                  type: 'number',
                  value: config.minZoom ?? '',
                }}
              />
              <Input
                label="Zoom max"
                className="mb-0 flex-1"
                addon={clearAddon(config.maxZoom !== undefined, () => update({ maxZoom: undefined }))}
                nativeInputProps={{
                  onChange: (event) => update({ maxZoom: event.target.value === '' ? undefined : Number(event.target.value) }),
                  placeholder: String(defaultMaxZoom),
                  type: 'number',
                  value: config.maxZoom ?? '',
                }}
              />
            </div>
            <div className="flex gap-4">
              <Input
                label="Largeur de l'iframe"
                className="mb-0 flex-1"
                addon={clearAddon(config.width !== '', () => update({ width: '' }))}
                nativeInputProps={{
                  onChange: (event) => update({ width: event.target.value }),
                  placeholder: DEFAULT_IFRAME_WIDTH,
                  value: config.width,
                }}
              />
              <Input
                label="Hauteur de l'iframe"
                className="mb-0 flex-1"
                addon={clearAddon(config.height !== '', () => update({ height: '' }))}
                nativeInputProps={{
                  onChange: (event) => update({ height: event.target.value }),
                  placeholder: DEFAULT_IFRAME_HEIGHT,
                  value: config.height,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold mb-0">Centrage et limites</h3>
            <p className="mb-0 text-sm text-(--text-mention-grey)">
              Réglez la position et le zoom de l'aperçu plus bas, puis capturez-les : «&nbsp;Utiliser le centrage de l'aperçu&nbsp;» fixe la
              vue d'ouverture de l'iframe ; «&nbsp;Limiter le déplacement à l'aperçu&nbsp;» empêche l'utilisateur de sortir de la zone
              visible.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="small" priority="secondary" iconId="fr-icon-focus-3-line" onClick={captureView}>
                Utiliser le centrage de l'aperçu
              </Button>
              <Button type="button" size="small" priority="secondary" iconId="fr-icon-crop-line" onClick={captureBounds}>
                Limiter le déplacement à l'aperçu
              </Button>
              {(config.center || config.maxBounds) && (
                <Button
                  type="button"
                  size="small"
                  priority="tertiary"
                  iconId="fr-icon-close-line"
                  onClick={() => update({ center: undefined, maxBounds: undefined, zoom: undefined })}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
            <span className="text-xs text-(--text-mention-grey)">
              {config.center
                ? `Centrage : ${config.center[0]}, ${config.center[1]} · zoom ${config.zoom}`
                : 'Centrage : France entière (défaut)'}
              {config.maxBounds ? ' · déplacement limité' : ''}
            </span>
          </div>
        </Section>

        <Section title="Aperçu">
          <p className="mb-0 text-sm text-(--text-mention-grey)">À la taille de l'iframe générée (largeur × hauteur définies ci-dessus).</p>
          {/* Inline width/height: user-entered CSS values (or the default when empty). */}
          <div className="max-w-full" style={{ width: config.width || DEFAULT_IFRAME_WIDTH }}>
            <div
              className="overflow-hidden rounded border border-(--border-default-grey)"
              style={{ height: config.height || DEFAULT_IFRAME_HEIGHT }}
            >
              <Map
                mapRef={mapRef}
                config={initialMapConfig}
                initialView={config.center ? { center: config.center, zoom: config.zoom } : undefined}
                maxBounds={config.maxBounds}
                minZoom={config.minZoom}
                maxZoom={config.maxZoom}
                legend={config.legend === 'off' ? false : config.legend}
                legendContent={<IframeLegend layers={config.layers} />}
                search={config.mode}
              >
                <FcuLogo />
                <ConfigSync layers={config.layers} gestionnaire={config.gestionnaire} reseaux={config.reseaux} />
              </Map>
            </div>
            <div className="text-right text-[11px] text-[#999]">
              Fourni par{' '}
              <a href={clientConfig.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#999] underline">
                France Chaleur Urbaine
              </a>
            </div>
          </div>
        </Section>

        <Section title="Code à intégrer">
          <Output label="URL" value={iframeUrl} />
          <Output label="Code iframe" value={iframeCode} />
        </Section>
      </div>
    </SimplePage>
  );
};

/** Titled section: the content (below the title) gets a left accent bar to separate the form areas. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="fr-h6 mb-0">{title}</h2>
      <div className="flex flex-col gap-4 border-l-3 border-(--border-action-high-blue-france) pl-4">{children}</div>
    </section>
  );
}

/** Click-to-copy code block (whole block clickable + "Copié" overlay), like the collectivités iframe blocks. */
function Output({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold">{label}</span>
      <ButtonCopy text={value} showOverlay title={`Copier (${label})`}>
        <code className="block cursor-pointer break-all rounded border border-(--border-default-grey) bg-(--background-alt-grey) p-3 text-xs fr-btn--icon-right fr-icon-clipboard-line">
          {value}
        </code>
      </ButtonCopy>
    </div>
  );
}

const round = (value: number, decimals = 6) => Number(value.toFixed(decimals));

export default IframeGeneratorPage;
