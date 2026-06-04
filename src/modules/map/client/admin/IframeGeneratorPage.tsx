import Badge from '@codegouvfr/react-dsfr/Badge';
import { memo, type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clientConfig } from '@/client-config';
import Checkbox from '@/components/form/dsfr/Checkbox';
import Input from '@/components/form/dsfr/Input';
import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import ButtonCopy from '@/components/ui/ButtonCopy';
import Heading from '@/components/ui/Heading';
import { MultiAutocompleteField } from '@/modules/form/MultiAutocompleteField';
import { defaultMaxZoom, defaultMinZoom } from '@/modules/map/shared/config';
import { gestionnairesFilters } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';
import { formatFrenchDate, formatFrenchDateTime } from '@/utils/date';

import { createMapConfiguration } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { FcuLogo } from '../controls/FcuLogo';
import type { MapCanvasController } from '../core/controller';
import { type LayerKey, layerKeys } from '../iframeCarteParams';
import { reseauDeChaleurNonClasseColor } from '../layers/specs/reseauxDeChaleur';
import { reseauxDeFroidColor } from '../layers/specs/reseauxDeFroid';
import { reseauxEnConstructionColor } from '../layers/specs/reseauxEnConstruction';
import { IframeLegend } from '../legend/IframeLegend';
import { Map } from '../Map';
import {
  buildFormIframeCode,
  buildFormIframeUrl,
  buildIframeCode,
  buildIframeUrl,
  DEFAULT_IFRAME_HEIGHT,
  DEFAULT_IFRAME_WIDTH,
  defaultIframeConfig,
  type IframeConfig,
  toCssSize,
} from './iframeGenerator';

const layerLabels: Record<LayerKey, string> = {
  'perimetres-de-developpement-prioritaire': 'Périmètres de développement prioritaire',
  'reseaux-de-chaleur': 'Réseaux de chaleur',
  'reseaux-de-froid': 'Réseaux de froid',
  'reseaux-en-construction': 'Réseaux en construction',
};

/** Short label + legend color per réseau layer, used by the filter-scope pastilles. */
const layerScopeMeta = {
  'reseaux-de-chaleur': { color: reseauDeChaleurNonClasseColor, label: 'chaleur' },
  'reseaux-de-froid': { color: reseauxDeFroidColor, label: 'froid' },
  'reseaux-en-construction': { color: reseauxEnConstructionColor, label: 'en construction' },
} as const satisfies Record<string, { color: string; label: string }>;

type ReseauLayerKey = keyof typeof layerScopeMeta;

// Known gestionnaires for the suggestion chips (free text stays allowed). `autre`
// is a filter pseudo-value, excluded.
const gestionnaireSuggestions = gestionnairesFilters.filter((option) => option.value !== 'autre');

const IframeGeneratorPage = () => {
  const [config, setConfig] = useState<IframeConfig>(defaultIframeConfig);
  const mapRef = useRef<MapCanvasController | null>(null);
  const trpcUtils = trpc.useUtils();

  const update = (patch: Partial<IframeConfig>) => setConfig((current) => ({ ...current, ...patch }));

  // Vanilla client (not `.fetch`/React Query): forwards the abort signal for switchMap cancellation
  // and bypasses staleTime caching + retry, which would otherwise stall the autocomplete spinner.
  const fetchGestionnaires = useCallback(
    (search: string, signal: AbortSignal) => trpcUtils.client.reseaux.searchOperators.query({ field: 'gestionnaire', search }, { signal }),
    [trpcUtils]
  );
  const fetchMaitresOuvrage = useCallback(
    (search: string, signal: AbortSignal) => trpcUtils.client.reseaux.searchOperators.query({ field: 'maitreOuvrage', search }, { signal }),
    [trpcUtils]
  );

  // --- Persistance de l'intégration (source de tracking) ---
  const [showArchived, setShowArchived] = useState(false);
  const { data: iframeSources = [] } = trpc.conversionTracking.sources.list.useQuery({ includeArchived: showArchived });

  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSaved = () => {
    setSaveError(null);
    void trpcUtils.conversionTracking.sources.list.invalidate();
  };
  const createSource = trpc.conversionTracking.sources.create.useMutation({
    onError: (error) => setSaveError(error.message),
    onSuccess: (row) => {
      setIntegrationId(row.id);
      onSaved();
    },
  });
  const updateSource = trpc.conversionTracking.sources.update.useMutation({
    onError: (error) => setSaveError(error.message),
    onSuccess: onSaved,
  });
  const archiveSource = trpc.conversionTracking.sources.archive.useMutation({ onSuccess: onSaved });

  const resetIntegration = () => {
    setIntegrationId(null);
    setLabel('');
    setConfig(defaultIframeConfig);
    setSaveError(null);
  };

  const loadIntegration = (id: string) => {
    const row = iframeSources.find((entry) => entry.id === id);
    if (!row) {
      resetIntegration();
      return;
    }
    setIntegrationId(row.id);
    setLabel(row.label);
    setConfig({ ...defaultIframeConfig, ...((row.config as Partial<IframeConfig> | null) ?? {}) });
    setSaveError(null);
  };

  const saveIntegration = () => {
    setSaveError(null);
    if (integrationId) {
      updateSource.mutate({ config, id: integrationId, label });
    } else {
      createSource.mutate({ config, label });
    }
  };

  const archiveIntegration = () => {
    if (integrationId && window.confirm('Archiver cette intégration ? Les statistiques restent conservées.')) {
      archiveSource.mutate({ id: integrationId });
      resetIntegration();
    }
  };

  const isSaving = createSource.isPending || updateSource.isPending;

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

  // L'id (uuid) de l'intégration sert de source `?source=` ; les blocs de code ne s'affichent qu'une fois l'intégration créée.
  const iframeUrl = buildIframeUrl(config, integrationId);
  const iframeCode = buildIframeCode(config, integrationId);
  const formIframeUrl = buildFormIframeUrl(integrationId);
  const formIframeCode = buildFormIframeCode(integrationId);

  return (
    <SimplePage
      title="Générateur d'iframes"
      description="Génère l'URL et le code d'intégration d'une carte ou d'un formulaire de test d'adresse à embarquer"
      mode="authenticated"
    >
      <div className="fr-container fr-py-4w flex flex-col gap-8">
        <div>
          <Heading as="h1" color="blue-france">
            Générateur d'iframes
          </Heading>
          <p className="mb-0 text-sm text-(--text-mention-grey)">
            Configurez la carte, ajustez la vue dans l'aperçu, puis copiez le code à intégrer sur un site partenaire. Le formulaire de test
            d'adresse (variante légère) est en bas de page.
          </p>
        </div>

        <Section title="Intégration">
          <p className="mb-0 text-sm text-(--text-mention-grey)">
            Chaque intégration = une iframe déployée chez un partenaire. Sa source identifie le tracking de conversion (affichages, tests,
            demandes).
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <Checkbox
                label="Voir les archivées"
                nativeInputProps={{
                  checked: showArchived,
                  name: 'showArchived',
                  onChange: (event) => setShowArchived(event.target.checked),
                }}
              />
            </div>
            {iframeSources.length === 0 ? (
              <p className="mb-0 text-sm text-(--text-mention-grey)">Aucune intégration enregistrée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-(--border-default-grey) text-left">
                      <th className="p-2">Nom</th>
                      <th className="p-2 whitespace-nowrap">Créée le</th>
                      {showArchived && <th className="p-2">Statut</th>}
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {iframeSources.map((row) => (
                      <tr
                        key={row.id}
                        aria-current={row.id === integrationId ? true : undefined}
                        className={`border-b border-(--border-default-grey)${row.id === integrationId ? ' bg-(--background-open-blue-france)' : ''}`}
                      >
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => loadIntegration(row.id)}
                            className="cursor-pointer text-left font-medium text-(--text-action-high-blue-france) hover:underline"
                          >
                            {row.label}
                          </button>
                        </td>
                        <td className="p-2 whitespace-nowrap" title={formatFrenchDateTime(new Date(row.created_at))}>
                          {formatFrenchDate(new Date(row.created_at))}
                        </td>
                        {showArchived && (
                          <td className="p-2">
                            {row.archived_at ? (
                              <Badge small noIcon>
                                Archivée
                              </Badge>
                            ) : (
                              <span className="text-(--text-mention-grey)">Active</span>
                            )}
                          </td>
                        )}
                        <td className="p-2 text-right whitespace-nowrap">
                          <Button
                            priority="tertiary"
                            size="small"
                            iconId="fr-icon-bar-chart-box-line"
                            title={`Voir la conversion de l'intégration « ${row.label} »`}
                            linkProps={{ href: `/admin/conversion?source=${encodeURIComponent(row.id)}` }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Input
            label="Nom de l'intégration"
            className="mb-0 max-w-md"
            hintText="Ex : Engie — site corporate"
            nativeInputProps={{
              onChange: (event) => setLabel(event.target.value),
              required: true,
              value: label,
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="small" onClick={saveIntegration} disabled={!label || isSaving}>
              {integrationId ? "Enregistrer l'intégration" : "Créer l'intégration"}
            </Button>
            {integrationId && (
              <>
                <Button type="button" size="small" priority="tertiary" onClick={resetIntegration}>
                  Nouvelle
                </Button>
                <Button type="button" size="small" priority="tertiary" iconId="fr-icon-archive-line" onClick={archiveIntegration}>
                  Archiver
                </Button>
              </>
            )}
          </div>
          {saveError && <p className="mb-0 text-sm text-(--text-default-error)">{saveError}</p>}
        </Section>

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
              <MultiAutocompleteField
                label="Filtrer par gestionnaire"
                hintText={scopeHint(
                  ['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction'],
                  'Saisie ou suggestions — Entrée pour ajouter.'
                )}
                placeholder="Ex : dalkia"
                values={config.gestionnaire}
                onChange={(gestionnaire) => update({ gestionnaire: [...new Set(gestionnaire.map((value) => value.toLowerCase()))] })}
                suggestions={gestionnaireSuggestions}
                fetchFn={fetchGestionnaires}
              />

              <MultiAutocompleteField
                label="Filtrer par maître d'ouvrage"
                hintText={scopeHint(['reseaux-de-chaleur', 'reseaux-de-froid'], 'Saisie ou suggestions — Entrée pour ajouter.')}
                placeholder="Ex : Métropole de Lyon"
                values={config.maitreOuvrage}
                onChange={(maitreOuvrage) => update({ maitreOuvrage })}
                fetchFn={fetchMaitresOuvrage}
              />

              <MultiAutocompleteField
                label="Filtrer par identifiants SNCU"
                hintText={scopeHint(
                  ['reseaux-de-chaleur', 'reseaux-de-froid'],
                  'Isole ces réseaux. Limité aux identifiants SNCU pour le moment. Entrée pour ajouter.'
                )}
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
                { label: 'Repliée', value: 'hidden' },
                { label: 'Ouverte (auto)', value: 'auto' },
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
                nativeInputProps={{
                  onChange: (event) => update({ width: event.target.value }),
                  placeholder: DEFAULT_IFRAME_WIDTH,
                  value: config.width,
                }}
              />
              <Input
                label="Hauteur de l'iframe"
                className="mb-0 flex-1"
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

        {/* Remonte la carte au changement d'intégration : `initialView` est mount-only. */}
        <MapPreview key={integrationId ?? 'new'} config={config} mapRef={mapRef} />

        <Section title="Code à intégrer (carte)">
          {integrationId ? (
            <>
              <Output label="URL" value={iframeUrl} openHref={iframeUrl} />
              <Output label="Code iframe" value={iframeCode} />
            </>
          ) : (
            <RequireIntegrationNotice />
          )}
        </Section>

        <Section title="Code à intégrer (formulaire de test d'adresse)">
          <p className="mb-0 text-sm text-(--text-mention-grey)">
            Variante légère sans carte : un mini-formulaire (adresse + chauffage) qui redirige vers le site FCU pour réaliser le test. Le
            test et la demande restent attribués à la source de l'intégration sélectionnée ci-dessus.
          </p>
          {integrationId ? (
            <>
              <Output label="URL" value={formIframeUrl} openHref={formIframeUrl} />
              <Output label="Code iframe" value={formIframeCode} />
            </>
          ) : (
            <RequireIntegrationNotice />
          )}
        </Section>
      </div>
    </SimplePage>
  );
};

export default IframeGeneratorPage;

/**
 * Memoized map preview: only a `config` identity change re-renders it. Typing in the integration
 * fields (label, source key) re-renders the page on every keystroke — the maplibre subtree must not
 * follow (its `initialView` / `legendContent` props are recreated per render, cascading the cost).
 */
const MapPreview = memo(function MapPreview({ config, mapRef }: { config: IframeConfig; mapRef: RefObject<MapCanvasController | null> }) {
  // Mount config for <Map> (config prop is mount-only); <ConfigSync> keeps it live afterwards.
  const initialMapConfig = useMemo(
    () =>
      createMapConfiguration({
        ...(config.gestionnaire.length > 0 ? { filtreGestionnaire: config.gestionnaire } : {}),
        ...(config.maitreOuvrage.length > 0 ? { filtreMaitreOuvrage: config.maitreOuvrage } : {}),
        ...(config.reseaux.length > 0 ? { filtreIdentifiantReseau: config.reseaux } : {}),
        reseauxDeChaleur: { show: config.layers.includes('reseaux-de-chaleur') },
        reseauxDeFroid: config.layers.includes('reseaux-de-froid'),
        reseauxEnConstruction: config.layers.includes('reseaux-en-construction'),
        zonesDeDeveloppementPrioritaire: config.layers.includes('perimetres-de-developpement-prioritaire'),
      }),
    [config.layers, config.gestionnaire, config.maitreOuvrage, config.reseaux]
  );

  return (
    <Section title="Aperçu">
      <p className="mb-0 text-sm text-(--text-mention-grey)">À la taille de l'iframe générée (largeur × hauteur définies ci-dessus).</p>
      {/* Inline width/height, normalized (bare number → px) so the preview matches the generated iframe. */}
      <div className="max-w-full" style={{ width: toCssSize(config.width, DEFAULT_IFRAME_WIDTH) }}>
        <div
          className="overflow-hidden rounded border border-(--border-default-grey)"
          style={{ height: toCssSize(config.height, DEFAULT_IFRAME_HEIGHT) }}
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
            <ConfigSync
              layers={config.layers}
              gestionnaire={config.gestionnaire}
              maitreOuvrage={config.maitreOuvrage}
              reseaux={config.reseaux}
            />
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
  );
});

/** Colored dots indicating which réseau layers a filter applies to. */
function FilterScope({ layers }: { layers: readonly ReseauLayerKey[] }) {
  return (
    <span className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
      {layers.map((key) => (
        <span key={key} className="inline-flex items-center gap-1">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: layerScopeMeta[key].color }} />
          {layerScopeMeta[key].label}
        </span>
      ))}
    </span>
  );
}

/**
 * Pushes the editable layer/filter state into the live map config (the `config`
 * prop is mount-only). Uses `updateProperty` to avoid clobbering the RDC limits
 * hydrated by `<MapStoreProvider>`.
 */
function ConfigSync({
  layers,
  gestionnaire,
  maitreOuvrage,
  reseaux,
}: Pick<IframeConfig, 'layers' | 'gestionnaire' | 'maitreOuvrage' | 'reseaux'>) {
  const { updateProperty } = useMapConfig();
  useEffect(() => {
    updateProperty('reseauxDeChaleur.show', layers.includes('reseaux-de-chaleur'));
    updateProperty('reseauxDeFroid', layers.includes('reseaux-de-froid'));
    updateProperty('reseauxEnConstruction', layers.includes('reseaux-en-construction'));
    updateProperty('zonesDeDeveloppementPrioritaire', layers.includes('perimetres-de-developpement-prioritaire'));
    updateProperty('filtreGestionnaire', gestionnaire);
    updateProperty('filtreMaitreOuvrage', maitreOuvrage);
    updateProperty('filtreIdentifiantReseau', reseaux);
  }, [updateProperty, layers, gestionnaire, maitreOuvrage, reseaux]);
  return null;
}

/** Builds a `MultiAutocompleteField` hint with the réseau-scope pastilles prefixed. */
function scopeHint(scope: readonly ReseauLayerKey[], text: ReactNode): ReactNode {
  return (
    <>
      <FilterScope layers={scope} />
      {text}
    </>
  );
}

/** Embed code is gated behind a persisted integration: every generated iframe must carry a tracking source. */
function RequireIntegrationNotice() {
  return (
    <p className="mb-0 text-sm text-(--text-default-warning)">
      Créez ou sélectionnez une intégration ci-dessus pour générer le code à intégrer.
    </p>
  );
}

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
function Output({ label, value, openHref }: { label: string; value: string; openHref?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{label}</span>
        {openHref && (
          <Button
            priority="tertiary"
            size="small"
            iconId="fr-icon-external-link-line"
            iconPosition="right"
            linkProps={{ href: openHref, rel: 'noopener noreferrer', target: '_blank' }}
          >
            Ouvrir
          </Button>
        )}
      </div>
      <ButtonCopy text={value} showOverlay title={`Copier (${label})`}>
        <code className="block cursor-pointer break-all rounded border border-(--border-default-grey) bg-(--background-alt-grey) p-3 text-xs fr-btn--icon-right fr-icon-clipboard-line">
          {value}
        </code>
      </ButtonCopy>
    </div>
  );
}

const round = (value: number, decimals = 6) => Number(value.toFixed(decimals));
