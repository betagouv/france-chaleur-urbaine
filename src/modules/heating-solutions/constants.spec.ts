import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { articleSections, articlesBySlug } from '@/components/Ressources/config';
import { modesDeChauffage } from '@/modules/chaleur-renouvelable/client/heating-modes/catalog';

import { getHeatingSolution, getHeatingSolutionHref, heatingSolutions } from './constants';
import { heatingSolutionContent } from './content';

describe('validated heating solution publication', () => {
  it('publishes exactly the fifteen validated source pages with unique routes and mode mappings', () => {
    expect(heatingSolutions.length).toStrictEqual(15);
    expect(new Set(heatingSolutions.map((solution) => solution.slug)).size).toStrictEqual(15);
    const modeIds = heatingSolutions.flatMap((solution) => [...solution.modeIds]);
    expect(new Set(modeIds).size).toStrictEqual(modeIds.length);
  });

  it.each(heatingSolutions)('registers $slug in the first article category with a complete static body', (solution) => {
    expect(getHeatingSolution(solution.slug)).toStrictEqual(solution);
    expect(articleSections[0].slugs).toContain(solution.slug);
    expect(articlesBySlug[solution.slug].title).toStrictEqual(solution.title);
    const content = renderToStaticMarkup(createElement(heatingSolutionContent[solution.slug]));
    const article = document.createElement('div');
    article.innerHTML = content;
    expect([...article.querySelectorAll('a')].filter((link) => link.textContent?.includes('Faites le test')).length).toStrictEqual(3);
    expect(article.querySelectorAll('#en-quelques-mots h3').length).toStrictEqual(4);
    expect(article.querySelectorAll('section').length).toStrictEqual(11);
    expect(content).not.toMatch(/discussion:\/\/|discussion-urls|notion-file-block:\/\//);
    expect(content).not.toContain('figma.com/api/mcp/asset');
    expect(statSync(join(process.cwd(), 'public', solution.image)).size).toBeGreaterThan(0);
    solution.modeIds.forEach((modeId) => expect(getHeatingSolutionHref(modeId)).toStrictEqual(`/ressources/${solution.slug}`));
  });

  it.each(['collective-solar-atmospheric-heat-pump-hot-water', 'individual-apartment-solar-atmospheric-heat-pump-hot-water'] as const)(
    'does not link %s to an unvalidated or unrelated article',
    (modeId) => {
      expect(getHeatingSolutionHref(modeId)).toStrictEqual(undefined);
    }
  );

  it('keeps every simulator illustration available after the autumn illustration update', () => {
    Object.values(modesDeChauffage)
      .flat()
      .forEach((mode) => {
        expect(existsSync(join(process.cwd(), 'public', mode.icone))).toStrictEqual(true);
      });
  });

  it('preserves the approved CEPAC resource link and omits the two rejected individual-house references', () => {
    const content = renderToStaticMarkup(createElement(heatingSolutionContent['pac-air-eau-collective']));
    expect(content).toContain('https://cepac-experts.org/carte-realisations-exemplaires/?type-doperation=renovation');
    expect(content).not.toContain('8595-etude-sur-les-consommations-des-pac-air-air');
    expect(content).not.toContain('les-pompes-a-chaleur-une-solution-a-fort-potentiel');
  });
});
