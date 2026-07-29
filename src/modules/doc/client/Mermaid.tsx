import { useIsDark } from '@codegouvfr/react-dsfr/useIsDark';
import { useEffect, useId, useRef, useState } from 'react';

type MermaidProps = {
  chart: string;
};

// Rendered SVGs are cached (memory + sessionStorage) so an already-seen diagram remounts at
// its final height synchronously. Without this, diagrams render long after `load` (dynamic
// import + mermaid.render), the page height keeps growing and the browser abandons its native
// scroll restoration on back navigation, landing the user at the top of the page.
const svgMemoryCache = new Map<string, string>();

/**
 * djb2 string hash (Bernstein — http://www.cse.yorku.ca/~oz/hash.html): `hash = hash * 33 ^ char`
 * seeded with 5381. Non-cryptographic; only used to derive a compact stable cache key from a
 * chart's content, where a collision would at worst display a wrong diagram until re-render.
 */
const djb2Hash = (input: string): string => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // >>> 0 reinterprets as unsigned 32 bits, so the base-36 form is short and has no minus sign
  return (hash >>> 0).toString(36);
};

const svgCacheKey = (chart: string, isDark: boolean) => `mermaid-svg:${isDark ? 'dark' : 'neutral'}:${djb2Hash(chart)}`;

const readSvgCache = (key: string): string | undefined => {
  try {
    return svgMemoryCache.get(key) ?? window.sessionStorage.getItem(key) ?? undefined;
  } catch {
    return svgMemoryCache.get(key);
  }
};

const writeSvgCache = (key: string, svg: string) => {
  svgMemoryCache.set(key, svg);
  try {
    window.sessionStorage.setItem(key, svg);
  } catch {
    // sessionStorage full or unavailable: the memory cache still covers SPA navigations
  }
};

/**
 * Renders a Mermaid diagram client-side, following the DSFR dark mode.
 * The mermaid library is imported lazily so it only loads on documentation pages.
 * Clickable nodes (click directives) get a permanent ↗ marker plus cursor and
 * hover styles, as mermaid renders links without any visual affordance.
 */
export function Mermaid({ chart }: MermaidProps) {
  const diagramId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { isDark } = useIsDark();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>();
  const [renderError, setRenderError] = useState<string>();

  // re-render when the chart or the theme changes; mermaid.render() needs a document-unique id
  useEffect(() => {
    const cacheKey = svgCacheKey(chart, isDark);
    const cached = readSvgCache(cacheKey);
    if (cached) {
      setSvg(cached);
      return;
    }
    let isCancelled = false;
    void (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          fontFamily: 'inherit',
          // 'loose' enables click links on nodes — safe: charts are static content authored in the repo, no user input
          securityLevel: 'loose',
          startOnLoad: false,
          theme: isDark ? 'dark' : 'neutral',
        });
        const renderResult = await mermaid.render(`mermaid-${diagramId}`, chart);
        writeSvgCache(cacheKey, renderResult.svg);
        if (!isCancelled) {
          setSvg(renderResult.svg);
        }
      } catch (error) {
        if (!isCancelled) {
          setRenderError(error instanceof Error ? error.message : String(error));
        }
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [chart, diagramId, isDark]);

  // add a ↗ marker in the corner of each clickable node once the SVG is in the DOM (guard makes it idempotent)
  useEffect(() => {
    containerRef.current?.querySelectorAll('svg a').forEach((link) => {
      const nodeRect = link.querySelector('rect');
      if (!nodeRect || link.querySelector('.link-marker')) {
        return;
      }
      const nodeBox = nodeRect.getBBox();
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      marker.textContent = '↗';
      marker.setAttribute('class', 'link-marker');
      marker.setAttribute('x', String(nodeBox.x + nodeBox.width - 13));
      marker.setAttribute('y', String(nodeBox.y + 13));
      marker.setAttribute('font-size', '11');
      marker.setAttribute('fill', 'currentColor');
      marker.setAttribute('opacity', '0.6');
      marker.setAttribute('pointer-events', 'none');
      nodeRect.parentElement?.appendChild(marker);
    });
  }, [svg]);

  if (renderError) {
    return (
      <pre className="my-6 p-4 text-sm bg-(--background-alt-grey) overflow-x-auto whitespace-pre-wrap">
        Erreur de rendu du diagramme : {renderError}
        {'\n\n'}
        {chart}
      </pre>
    );
  }

  return svg ? (
    <div
      ref={containerRef}
      className="my-6 overflow-x-auto [&_svg]:max-w-full [&_svg_a]:cursor-pointer [&_svg_a:hover_rect]:filter-[brightness(0.93)] [&_svg_a:hover_.nodeLabel]:underline"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  ) : (
    <div className="my-6 text-sm text-faded">Chargement du diagramme…</div>
  );
}
