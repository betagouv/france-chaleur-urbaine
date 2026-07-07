import { useIsDark } from '@codegouvfr/react-dsfr/useIsDark';
import { useEffect, useId, useRef, useState } from 'react';

type MermaidProps = {
  chart: string;
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
      className="my-6 overflow-x-auto [&_svg]:max-w-full [&_svg_a]:cursor-pointer [&_svg_a:hover_rect]:[filter:brightness(0.93)] [&_svg_a:hover_.nodeLabel]:underline"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  ) : (
    <div className="my-6 text-sm text-faded">Chargement du diagramme…</div>
  );
}
